import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, FlatList, Modal, Platform,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

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
  
  const meetingPointRef = useRef(null);
  const webAutocompleteRefs = {
    meetingPoint: useRef(null)
  };
  const MAPS_KEY = "AIzaSyDw26V3Tw0g6tXKWX5ruHx8nAl6eJrn7vI"; 

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
  if (Platform.OS === 'web' && isWebMapsLoaded) {
    const initAutocomplete = () => {
      try {
        const meetingInput = document.getElementById('meeting-point-input');
        if (meetingInput && !webAutocompleteRefs.meetingPoint.current) {
          const options = {
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address', 'geometry', 'place_id']
          };

          webAutocompleteRefs.meetingPoint.current = new window.google.maps.places.Autocomplete(
            meetingInput,
            options
          );

          webAutocompleteRefs.meetingPoint.current.addListener('place_changed', () => {
            const place = webAutocompleteRefs.meetingPoint.current.getPlace();
            if (!place.geometry) {
              console.warn("No geometry available for place:", place);
              return;
            }

            const location = {
              address: place.formatted_address,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              placeId: place.place_id
            };

            setMeetingPoint(location);
            setFormData(prev => ({
              ...prev,
              address: place.formatted_address,
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng()
            }));
          });
        }
      } catch (error) {
        console.error('Autocomplete initialization error:', error);
      }
    };

    // Add slight delay to ensure DOM is ready
    const timer = setTimeout(initAutocomplete, 300);
    return () => clearTimeout(timer);
  }
}, [isWebMapsLoaded]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (window.google && window.google.maps) {
        setIsWebMapsLoaded(true);
        return;
      }

      const scriptId = 'google-maps-script';
      if (document.getElementById(scriptId)) {
        setIsWebMapsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        setIsWebMapsLoaded(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
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

    if (!meetingPoint.address) {
      newErrors.address = 'Location is required';
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
    let address, lat, lng, placeId;
    
    if (Platform.OS === 'web') {
      if (!details) return;
      
      address = details.description;
      lat = details.geometry.location.lat();
      lng = details.geometry.location.lng();
      placeId = details.place_id;
    } else {
      if (!details) {
        console.warn('No details for place:', data?.description);
        return;
      }
      
      address = data.description;
      lat = details.geometry?.location?.lat || null;
      lng = details.geometry?.location?.lng || null;
      placeId = details.place_id;
    }
    
    setMeetingPoint({ address, lat, lng, placeId });
    
    if (Platform.OS !== 'web' && meetingPointRef.current) {
      meetingPointRef.current.setAddressText(address);
      meetingPointRef.current.blur();
    }
    
    setFormData(prev => ({
      ...prev,
      address: address,
      latitude: lat,
      longitude: lng
    }));
  };

  const renderLocationInput = (label, key, value, onChangeText) => {
    return (
      <>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          id={`${key}-input`}
          style={styles.input}
          placeholder={`Enter ${label.toLowerCase()}`}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="#888"
        />
        {errors.address ? (
          <Text style={styles.errorText}>{errors.address}</Text>
        ) : null}
      </>
    );
  };

 const renderMobileAutocomplete = (label, ref, onPress) => {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.autocompleteWrapper}>
        <GooglePlacesAutocomplete
          placeholder={`Search ${label}`}
          onPress={(data, details = null) => {
            onPress(data, details);
          }}
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
          ref={ref}
          fetchDetails={true}
          enablePoweredByContainer={false}
          debounce={300}
          keepResultsAfterBlur={false}
          listViewDisplayed="auto"
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
      </View>
    </>
  );
};

  const handleAddDonationBox = async () => {
    if (!validateForm()) return;

    try {
      const donationBoxData = {
        ...formData,
        latitude: meetingPoint.lat,
        longitude: meetingPoint.lng
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
              renderLocationInput(
                'Location *',
                'meeting-point',
                meetingPoint.address,
                (text) => setMeetingPoint(prev => ({ ...prev, address: text }))
              )
            ) : (
              renderMobileAutocomplete(
                'Location *',
                meetingPointRef,
                handleMeetingPointSelect
              )
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
  formContainer: {
    flex: 1,
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
  addressContainer: {
    marginBottom: 15,
    zIndex: 1000,
  },
  googleContainer: {
    position: 'relative',
    width: '100%',
  },
  googleInput: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 15 : 10,
    borderRadius: 8,
    fontSize: 16,
    height: 50,
    marginTop: 0,
    color: '#000',
    borderWidth: 1,
    borderColor: '#eee',
  },
  googleList: {
    backgroundColor: '#fff',
    marginTop: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  googleDescription: {
    fontSize: 14,
    padding: 10,
    color: '#333',
  },
  searchIcon: {
    marginLeft: 10,
    marginRight: 5,
    alignSelf: 'center',
  },
  coordinateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  coordinateWrapper: {
    width: '48%',
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  coordinateInput: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
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
  zIndex: 1000, // Ensure it appears above other elements
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
});

export default ManageDonationBoxesScreen;