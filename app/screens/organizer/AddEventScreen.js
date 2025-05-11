import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import axios from 'axios';
import { auth } from '../../firebaseConfig'; 
import { getIdToken } from 'firebase/auth';
import { GeoPoint } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const MAPS_KEY = "AIzaSyDw26V3Tw0g6tXKWX5ruHx8nAl6eJrn7vI";

const predefinedItems = ['Clothes', 'Toys', 'Books', 'Groceries', 'Electronics'];

const AddEventScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    date: '',
    items_accepted: [],
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [eventDate, setEventDate] = useState(new Date());
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
        />
      </>
    );
  };
   const renderMobileAutocomplete = (label, ref, onPress) => {
    return (
      <>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.autocompleteWrapper}>
          <GooglePlacesAutocomplete
            placeholder={`Enter ${label.toLowerCase()}`}
            onPress={onPress}
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
            ref={ref}
            fetchDetails
            enablePoweredByContainer={false}
            debounce={300}
            keepResultsAfterBlur={false}
            listViewDisplayed="auto"
            renderRow={(item) => <Text style={styles.placeItem}>{item.description}</Text>}
          />
        </View>
      </>
    );
  };

  useEffect(() => {
    if (Platform.OS === 'web' && isWebMapsLoaded) {
      try {
        const meetingInput = document.getElementById('meeting-point-input');
        if (meetingInput && !webAutocompleteRefs.meetingPoint.current) {
          webAutocompleteRefs.meetingPoint.current = new window.google.maps.places.Autocomplete(
            meetingInput,
            {
              types: ['geocode', 'establishment'],
              componentRestrictions: { country: 'us' },
              fields: ['formatted_address', 'geometry', 'place_id']
            }
          );
          
          webAutocompleteRefs.meetingPoint.current.addListener('place_changed', () => {
            const place = webAutocompleteRefs.meetingPoint.current.getPlace();
            if (!place.geometry) return;
            
            handleMeetingPointSelect(null, {
              description: place.formatted_address,
              geometry: { location: place.geometry.location },
              place_id: place.place_id
            });
          });
        }
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
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
  };



  const handleTextChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

   const onStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || eventDate;
    setShowStartPicker(false);
    setEventDate(currentDate);
  };

  const formatDisplayDate = (date) => {
  return date.toLocaleDateString(); // Customize format as needed
};


  const toggleCheckbox = (item) => {
    setFormData((prev) => {
      const alreadySelected = prev.items_accepted.includes(item);
      return {
        ...prev,
        items_accepted: alreadySelected
          ? prev.items_accepted.filter((i) => i !== item)
          : [...prev.items_accepted, item],
      };
    });
  };

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
  
      if (!user) {
        Alert.alert('Error', 'You must be logged in to submit an event.');
        return;
      }
  
      const token = await getIdToken(user);

      if (!formData.name || !formData.description || !meetingPoint.lat || formData.items_accepted.length === 0) {
        Alert.alert('Error', 'Please fill all required fields and select a valid location.');
        return;
      }

  
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
      if(response.status === 201){
        Alert.alert('Success', 'Event added successfully!');

      setFormData({
        name: '',
        description: '',
        location: '',
        date: '',
        items_accepted: [],
      });
    }else {
      Alert.alert('Error', 'Failed to add event.');
    }
    } catch (err) {
      console.error('Submission error:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to add event.');
    }
  };

   const DatePickerButton = ({ label, date, onPress }) => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>{label}</Text>
          <input
            type="date"
            value={date.toISOString().split('T')[0]}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              setEventDate(newDate);
            }}
            min={label === 'Event Date' 
              ? new Date().toISOString().split('T')[0] 
              : eventDate.toISOString().split('T')[0]}
            style={styles.webDateInput}
          />
        </View>
      );
    }

    return (
      <View style={styles.dateInputWrapper}>
        <Text style={styles.dateLabel}>{label}</Text>
        <TouchableOpacity onPress={onPress} style={styles.dateInput}>
          <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {['name', 'description'].map((field) => (
        <View key={field} style={styles.inputGroup}>
          <Text style={styles.label}>{field.toUpperCase()}</Text>
          <TextInput
            style={styles.input}
            placeholder={field}
            value={formData[field]}
            onChangeText={(text) => handleTextChange(field, text)}
          />
        </View>
      ))}

      {Platform.OS === 'web' ? (
            renderLocationInput(
              'Event Location',
              'meeting-point',
              meetingPoint.location,
              (text) => setMeetingPoint(prev => ({ ...prev, address: text })))
          ) : (
            renderMobileAutocomplete(
              'Event Location',
              meetingPointRef,
              handleMeetingPointSelect
            )
          )}


          <View style={styles.label}>
            <DatePickerButton
              label="Event Date"
              date={eventDate}
              onPress={() => setShowStartPicker(true)}
            />
          </View>

          
          {Platform.OS !== 'web' && showStartPicker && (
            <DateTimePicker
              value={eventDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={onStartDateChange}
            />
          )}
      

      <Text style={styles.label}>Items Accepted</Text>
      {predefinedItems.map((item) => (
        <View key={item} style={styles.checkboxContainer}>
          <Checkbox
            value={formData.items_accepted.includes(item)}
            onValueChange={() => toggleCheckbox(item)}
            color={formData.items_accepted.includes(item) ? '#4630EB' : undefined}
          />
          <Text style={styles.checkboxLabel}>{item}</Text>
        </View>
      ))}

      <Button title="Add Event" onPress={handleSubmit} />
    </ScrollView>
  );
};

export default AddEventScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
});
