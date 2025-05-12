import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, FlatList, Modal, Platform,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const MAPS_KEY = "AIzaSyDSahTexUybVADs-MwPT4MNnWai_-kTr1I"; // Replace with your actual API key

const ManageDonationBoxesScreen = () => {
  const [donationBoxes, setDonationBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonationBox, setSelectedDonationBox] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    type: '',
    hours: '',
    phone: ''
  });
  const [errors, setErrors] = useState({
    name: '',
    address: '',
    type: '',
    hours: ''
  });
  const [meetingPoint, setMeetingPoint] = useState({
    address: '',
    lat: null,
    lng: null,
    placeId: null
  });
  const [isWebMapsLoaded, setIsWebMapsLoaded] = useState(false);
  const [mapsLoadingError, setMapsLoadingError] = useState(false);
  
  const meetingPointRef = useRef(null);
  const autocompleteInitialized = useRef(false);

  const fetchDonationBoxes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/user/donation-boxes');
      setDonationBoxes(response.data);
    } catch (error) {
      console.error('Error fetching donation boxes:', error);
      Alert.alert('Error', 'Failed to fetch donation boxes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonationBoxes();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (window.google && window.google.maps) {
        setIsWebMapsLoaded(true);
        return;
      }

      const scriptId = 'google-maps-script';
      if (document.getElementById(scriptId)) {
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsWebMapsLoaded(true);
      };
      
      script.onerror = () => {
        setMapsLoadingError(true);
        Alert.alert('Error', 'Failed to load maps functionality');
      };

      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && isWebMapsLoaded && isAddModalVisible) {
      const timer = setTimeout(() => {
        initWebAutocomplete();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isWebMapsLoaded, isAddModalVisible]);

  const initWebAutocomplete = () => {
    try {
      const meetingInput = document.getElementById('meeting-point-input');
      
      if (!meetingInput || autocompleteInitialized.current) return;
      
      const options = {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'geometry', 'place_id', 'name']
      };

      const autocomplete = new window.google.maps.places.Autocomplete(
        meetingInput,
        options
      );
      
      meetingPointRef.current = autocomplete;
      autocompleteInitialized.current = true;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
          setErrors(prev => ({...prev, address: 'Invalid location selected'}));
          return;
        }
        
        const location = {
          address: place.formatted_address || place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: place.place_id
        };

        setMeetingPoint(location);
        setFormData(prev => ({
          ...prev,
          address: location.address,
          latitude: location.lat.toString(),
          longitude: location.lng.toString()
        }));
        
        setErrors(prev => ({...prev, address: ''}));
      });
      
    } catch (error) {
      console.error('Autocomplete initialization error:', error);
      setMapsLoadingError(true);
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: '',
      address: '',
      type: '',
      hours: ''
    };

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }

    if ((!meetingPoint.address && !formData.address) || 
        (!meetingPoint.lat && !formData.latitude) || 
        (!meetingPoint.lng && !formData.longitude)) {
      newErrors.address = 'Valid location is required';
      valid = false;
    }

    if (!formData.type.trim()) {
      newErrors.type = 'Type is required';
      valid = false;
    }

    if (!formData.hours.trim()) {
      newErrors.hours = 'Hours are required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleMeetingPointSelect = async (data, details = null) => {
    if (!details) return;
    
    const address = details.formatted_address || details.description || data?.description;
    const lat = details.geometry?.location?.lat;
    const lng = details.geometry?.location?.lng;
    const placeId = details.place_id;
    
    if (!lat || !lng) return;
    
    setMeetingPoint({
      address,
      lat,
      lng,
      placeId
    });
    
    setFormData(prev => ({
      ...prev,
      address,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
    
    setErrors(prev => ({...prev, address: ''}));
  };

  const handleAddDonationBox = async () => {
    if (!validateForm()) return;

    try {
      const latitude = meetingPoint.lat || parseFloat(formData.latitude);
      const longitude = meetingPoint.lng || parseFloat(formData.longitude);
      const address = meetingPoint.address || formData.address;
      
      if (!latitude || !longitude || !address) {
        setErrors(prev => ({...prev, address: 'Valid location coordinates required'}));
        return;
      }
      
      const donationBoxData = {
        ...formData,
        address,
        latitude,
        longitude
      };

      const response = await axios.post('http://localhost:5000/api/admin/donation-boxes', donationBoxData);
      setDonationBoxes([...donationBoxes, response.data]);
      setIsAddModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Donation box added successfully');
    } catch (error) {
      console.error('Error adding donation box:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add donation box');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      type: '',
      hours: '',
      phone: ''
    });
    
    setMeetingPoint({
      address: '',
      lat: null,
      lng: null,
      placeId: null
    });
    
    setErrors({
      name: '',
      address: '',
      type: '',
      hours: ''
    });
    
    if (Platform.OS === 'web') {
      setTimeout(() => {
        const meetingInput = document.getElementById('meeting-point-input');
        if (meetingInput) meetingInput.value = '';
      }, 100);
    }
  };

  const deleteDonationBox = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/donation-boxes/${selectedDonationBox._id}`);
      setSelectedDonationBox(null);
      await fetchDonationBoxes();
      Alert.alert('Success', 'Donation box deleted successfully');
    } catch (error) {
      console.error('Error deleting donation box:', error);
      Alert.alert('Error', 'Failed to delete donation box');
    }
  };

  const renderDonationBox = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedDonationBox(item)}>
      <View style={styles.boxContainer}>
        <Text style={styles.boxName}>{item.name}</Text>
        <Text style={styles.boxAddress}>{item.address}</Text>
        <Text style={styles.boxType}>{item.type}</Text>
      </View>
    </TouchableOpacity>
  );

  if (selectedDonationBox) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={() => setSelectedDonationBox(null)} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selectedDonationBox.name}</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color="#333" />
            <Text style={styles.detailText}>{selectedDonationBox.address}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="pricetag-outline" size={18} color="#333" />
            <Text style={styles.detailText}>{selectedDonationBox.type}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color="#333" />
            <Text style={styles.detailText}>{selectedDonationBox.hours}</Text>
          </View>
          
          {selectedDonationBox.phone && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={18} color="#333" />
              <Text style={styles.detailText}>{selectedDonationBox.phone}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={deleteDonationBox}
          >
            <Text style={styles.deleteButtonText}>Delete Donation Box</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Donation Boxes</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setIsAddModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#333" style={{ marginTop: 20 }} />
      ) : donationBoxes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="archive-outline" size={50} color="#999" />
          <Text style={styles.emptyText}>No donation boxes found</Text>
        </View>
      ) : (
        <FlatList
          data={donationBoxes}
          keyExtractor={(item) => item._id}
          renderItem={renderDonationBox}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal visible={isAddModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setIsAddModalVisible(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Donation Box</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter donation box name"
              placeholderTextColor="#999"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}

            {Platform.OS === 'web' ? (
              <>
                <Text style={styles.label}>Location * {mapsLoadingError && '(Maps functionality unavailable)'}</Text>
                <input
                  id="meeting-point-input"
                  type="text"
                  placeholder="Search location"
                  disabled={mapsLoadingError}
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    marginBottom: '15px',
                    backgroundColor: mapsLoadingError ? '#f1f1f1' : '#f8f8f8'
                  }}
                />
                {meetingPoint.address && (
                  <Text style={styles.selectedLocationText}>
                    Selected: {meetingPoint.address}
                  </Text>
                )}
                {errors.address ? (
                  <Text style={styles.errorText}>{errors.address}</Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.label}>Location *</Text>
                <GooglePlacesAutocomplete
                  placeholder="Search location"
                  onPress={handleMeetingPointSelect}
                  query={{
                    key: MAPS_KEY,
                    language: 'en',
                    components: 'country:us',
                    types: ['geocode', 'establishment']
                  }}
                  styles={{
                    textInput: [styles.input, { height: 50 }],
                    listView: styles.dropdown,
                    description: styles.placeDescription,
                    poweredContainer: { display: 'none' }
                  }}
                  ref={meetingPointRef}
                  fetchDetails={true}
                  enablePoweredByContainer={false}
                  debounce={300}
                  renderRow={(item) => (
                    <View style={styles.placeItem}>
                      <Ionicons name="location-outline" size={18} color="#666" />
                      <Text style={styles.placeText}>{item.description}</Text>
                    </View>
                  )}
                  textInputProps={{
                    placeholderTextColor: '#999',
                    returnKeyType: 'search',
                    autoCorrect: false,
                    autoCapitalize: 'none'
                  }}
                />
                {errors.address ? (
                  <Text style={styles.errorText}>{errors.address}</Text>
                ) : null}
              </>
            )}

            <Text style={styles.label}>Type *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Clothing, Electronics"
              placeholderTextColor="#999"
              value={formData.type}
              onChangeText={(text) => setFormData({ ...formData, type: text })}
            />
            {errors.type ? (
              <Text style={styles.errorText}>{errors.type}</Text>
            ) : null}

            <Text style={styles.label}>Hours *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mon-Sat 9am - 8pm"
              placeholderTextColor="#999"
              value={formData.hours}
              onChangeText={(text) => setFormData({ ...formData, hours: text })}
            />
            {errors.hours ? (
              <Text style={styles.errorText}>{errors.hours}</Text>
            ) : null}

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., +1 123-456-7890"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
          </View>

          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleAddDonationBox}
          >
            <Text style={styles.submitButtonText}>Add Donation Box</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#000',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxContainer: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  boxName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    color: '#000',
  },
  boxAddress: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  boxType: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#000',
  },
  detailCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  deleteButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
    color: '#000',
  },
  input: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  formSection: {
    flex: 1,
  },
  autocompleteWrapper: {
    zIndex: 1000,
    marginBottom: 15,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 5,
    maxHeight: 200,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  placeText: {
    marginLeft: 10,
    color: '#333',
  },
  placeDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedLocationText: {
    fontSize: 14,
    color: '#007bff',
    marginTop: -10,
    marginBottom: 15,
  },
});

export default ManageDonationBoxesScreen;