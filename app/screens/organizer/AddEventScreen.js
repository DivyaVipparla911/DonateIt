import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import Checkbox from 'expo-checkbox';
import axios from 'axios';
import { auth } from '../../firebaseConfig';
import { getIdToken } from 'firebase/auth';
import { GeoPoint } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const MAPS_KEY = "AIzaSyDw26V3Tw0g6tXKWX5ruHx8nAl6eJrn7vI";
const predefinedItems = ['Clothes', 'Toys', 'Books', 'Groceries', 'Electronics'];

const AddEventScreen = () => {
  // State management
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items_accepted: [],
  });
  const [meetingPoint, setMeetingPoint] = useState({
    address: '',
    lat: null,
    lng: null,
    placeId: null
  });
  const [eventDate, setEventDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [isWebMapsLoaded, setIsWebMapsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const meetingPointRef = useRef(null);

  // Initialize Google Maps for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const initAutocomplete = () => {
        const input = document.getElementById('meeting-point-input');
        if (input && window.google?.maps?.places) {
          const autocomplete = new window.google.maps.places.Autocomplete(input, {
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'us' },
            fields: ['formatted_address', 'geometry', 'place_id']
          });

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) {
              setLocationError('Please select a valid location from dropdown');
              return;
            }
            handleMeetingPointSelect(null, {
              formatted_address: place.formatted_address,
              geometry: { location: place.geometry.location },
              place_id: place.place_id
            });
          });
        }
      };

      if (window.google?.maps) {
        setIsWebMapsLoaded(true);
        initAutocomplete();
        return;
      }

      const scriptId = 'google-maps-script';
      if (document.getElementById(scriptId)) return;

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsWebMapsLoaded(true);
        initAutocomplete();
      };
      
      script.onerror = () => {
        Alert.alert('Error', 'Failed to load maps functionality');
      };

      document.head.appendChild(script);
    }
  }, []);

  // Handle location selection
  const handleMeetingPointSelect = (data, details = null) => {
    try {
      if (!details) {
        setLocationError('Please select a valid location from dropdown');
        return;
      }
      
      const address = details.formatted_address || data?.description;
      const lat = details.geometry?.location?.lat?.() || details.geometry?.location?.lat;
      const lng = details.geometry?.location?.lng?.() || details.geometry?.location?.lng;
      const placeId = details.place_id;

      if (!address || !lat || !lng) {
        setLocationError('Invalid location selected');
        return;
      }

      setMeetingPoint({ address, lat, lng, placeId });
      setLocationError('');
      
      if (Platform.OS !== 'web' && meetingPointRef.current) {
        meetingPointRef.current.setAddressText(address);
        meetingPointRef.current.blur();
      }
    } catch (err) {
      console.error('Location selection error:', err);
      setLocationError('Please select a valid location');
    }
  };

  // Form handlers
  const handleTextChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || eventDate;
    setShowStartPicker(false);
    setEventDate(currentDate);
  };

  const toggleCheckbox = (item) => {
    setFormData(prev => ({
      ...prev,
      items_accepted: prev.items_accepted.includes(item)
        ? prev.items_accepted.filter(i => i !== item)
        : [...prev.items_accepted, item]
    }));
  };

  // Form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setLocationError('');
      
      // Validate inputs
      if (!formData.name.trim()) throw new Error('Event name is required');
      if (!formData.description.trim()) throw new Error('Description is required');
      if (!meetingPoint.lat || !meetingPoint.lng) {
        throw new Error('Please select a valid location');
      }
      if (formData.items_accepted.length === 0) {
        throw new Error('Please select at least one accepted item');
      }

      const user = auth.currentUser;
      if (!user) throw new Error('You must be logged in');

      const token = await getIdToken(user);
      const payload = {
        token,
        name: formData.name,
        description: formData.description,
        location: {
          address: meetingPoint.address,
          coordinates: new GeoPoint(meetingPoint.lat, meetingPoint.lng),
          placeId: meetingPoint.placeId
        },
        date: eventDate.toISOString(),
        items_accepted: formData.items_accepted,
      };

      const response = await axios.post('http://localhost:5000/api/user/events', payload);
      
      if (response.status === 201) {
        Alert.alert('Success', 'Event added successfully!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          items_accepted: [],
        });
        setMeetingPoint({
          address: '',
          lat: null,
          lng: null,
          placeId: null
        });
        setEventDate(new Date());
      } else {
        throw new Error('Failed to add event');
      }
    } catch (err) {
      console.error('Submission error:', err);
      Alert.alert('Error', err.message);
      if (err.message.includes('location')) {
        setLocationError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Date picker component
  const DatePickerButton = ({ label }) => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.dateInputWrapper}>
          <Text style={styles.label}>{label}</Text>
          <input
            type="date"
            value={eventDate.toISOString().split('T')[0]}
            onChange={(e) => setEventDate(new Date(e.target.value))}
            min={new Date().toISOString().split('T')[0]}
            style={styles.webDateInput}
          />
        </View>
      );
    }

    return (
      <View style={styles.dateInputWrapper}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity 
          onPress={() => setShowStartPicker(true)} 
          style={styles.dateInput}
        >
          <Text style={styles.dateText}>
            {eventDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={eventDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onStartDateChange}
          />
        )}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Create Donation Event</Text>
      
      {/* Name Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>EVENT NAME *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter event name"
          placeholderTextColor="#999"
          value={formData.name}
          onChangeText={(text) => handleTextChange('name', text)}
        />
      </View>

      {/* Description Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>DESCRIPTION *</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Describe your donation event"
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          value={formData.description}
          onChangeText={(text) => handleTextChange('description', text)}
        />
      </View>

      {/* Location Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>LOCATION *</Text>
        {Platform.OS === 'web' ? (
          <>
            <TextInput
              id="meeting-point-input"
              style={styles.input}
              placeholder="Search for a location"
              placeholderTextColor="#999"
              value={meetingPoint.address}
              onChangeText={(text) => {
                setMeetingPoint(prev => ({ ...prev, address: text }));
                if (text && !meetingPoint.lat) {
                  setLocationError('Please select from dropdown');
                }
              }}
            />
            {!isWebMapsLoaded && <Text style={styles.loadingText}>Loading maps...</Text>}
            {locationError ? (
              <Text style={styles.errorText}>{locationError}</Text>
            ) : null}
          </>
        ) : (
          <View style={styles.autocompleteWrapper}>
            <GooglePlacesAutocomplete
              ref={meetingPointRef}
              placeholder="Search for a location"
              onPress={handleMeetingPointSelect}
              query={{
                key: MAPS_KEY,
                language: 'en',
                components: 'country:us',
                types: ['geocode', 'establishment']
              }}
              styles={{
                textInput: styles.input,
                listView: styles.dropdown,
                description: styles.placeDescription
              }}
              fetchDetails
              enablePoweredByContainer={false}
            />
            {locationError ? (
              <Text style={styles.errorText}>{locationError}</Text>
            ) : null}
          </View>
        )}
      </View>

      {/* Date Picker */}
      <View style={styles.inputGroup}>
        <DatePickerButton label="EVENT DATE *" />
      </View>

      {/* Items Accepted */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>ITEMS ACCEPTED *</Text>
        <View style={styles.checkboxGroup}>
          {predefinedItems.map((item) => (
            <View key={item} style={styles.checkboxContainer}>
              <Checkbox
                value={formData.items_accepted.includes(item)}
                onValueChange={() => toggleCheckbox(item)}
                color={formData.items_accepted.includes(item) ? '#000' : undefined}
              />
              <Text style={styles.checkboxLabel}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity 
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>CREATE EVENT</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  autocompleteWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 4,
  },
  placeDescription: {
    color: '#000',
  },
  dateInputWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
  },
  dateInput: {
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  webDateInput: {
    width: '100%',
    padding: 12,
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 16,
  },
  checkboxGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    marginBottom: 12,
    paddingVertical: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 4,
  },
});

export default AddEventScreen;