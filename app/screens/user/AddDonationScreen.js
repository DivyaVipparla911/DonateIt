import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  Alert, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  ActivityIndicator,
  StyleSheet 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { GeoPoint } from 'firebase/firestore';
import axios from 'axios';
import { auth } from '../../firebaseConfig'; 
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';


const MAPS_KEY = "AIzaSyDw26V3Tw0g6tXKWX5ruHx8nAl6eJrn7vI";

const DonationForm = () => {
  const [donationCategory, setDonationCategory] = useState('groceries');
  const [donationDescription, setDonationDescription] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [donationPhotos, setDonationPhotos] = useState([]);
  const [pickupTime, setPickupTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    description: '',
    address: '',
    photos: '',
    pickupTime: ''
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
      

  // Request permission for image picker
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to select images.');
        return false;
      }
    }
    return true;
  };

  // Handle image picker for mobile
  const handleChoosePhotosMobile = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaType: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (!result.canceled) {
        const selectedPhotos = result.assets.map((asset) => asset.uri);

        // Validate photo count
        if (selectedPhotos.length > 5) {
          setErrors(prev => ({...prev, photos: 'Maximum 5 photos allowed'}));
          return;
        }

        setDonationPhotos(selectedPhotos);
        setErrors(prev => ({...prev, photos: ''}));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    }
  };

  // Handle image picker based on platform
  const handleChoosePhotos = Platform.select({
    ios: handleChoosePhotosMobile,
    android: handleChoosePhotosMobile,
    web: () => document.getElementById('fileInput').click(), 
  });

  // Handle file change for web
  const handleFileChange = async (event) => {
    const files = event.target.files;

    // Validate photo count
    if (files.length > 5) {
      setErrors(prev => ({...prev, photos: 'Maximum 5 photos allowed'}));
      return;
    }

    const fileArray = Array.from(files);
    setDonationPhotos(fileArray);
    setErrors(prev => ({...prev, photos: ''}));
  };

  // Validate form fields
  const validateForm = () => {
    let isValid = true;
    const newErrors = { description: '', address: '', photos: '', pickupTime: '' };

    if (!donationDescription.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    // if (!donorAddress.trim()) {
    //   newErrors.address = 'Address is required';
    //   isValid = false;
    // }

     if (!pickupTime.trim()) {
      newErrors.pickupTime = 'Available time and date is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

const uploadToCloudinary = async (photos) => {
    const data = new FormData();

    // If using web, handle file properly
    if (Platform.OS === 'web') {
      data.append('file', photos);  // Directly append file for web
    } else {
      // For mobile, make sure the file structure is correct
      data.append('file', {
        uri: photo,
        name: `donation.jpg`, // Make file names unique
        type: 'image/jpeg', // Ensure file type is correct
      });
    }

    data.append('upload_preset', 'donations_preset'); // Ensure the preset is correct
    data.append('cloud_name', 'do0u4ae7b'); // Ensure the cloud name is correct

    try {
      // Upload to Cloudinary
      const res = await fetch('https://api.cloudinary.com/v1_1/do0u4ae7b/image/upload', {
        method: 'POST',
        body: data,
      });

      const result = await res.json();
      if (result.secure_url) {
        return result.secure_url; // Store the uploaded URL for each photo
      } else {
        throw new Error(`Failed to upload image`);
      }
    } catch (error) {
      console.error(`Error uploading image`, error);
      throw new Error('Cloudinary upload failed. Please try again.');
    }
};


  const handleSubmit = async () => {
     console.log("before validation");
    if (!validateForm()) {
      return;
    }
    console.log("after validation");
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to submit a donation.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = await user.getIdToken();
      const uploadedUrls = [];
      for (const photo of donationPhotos) {
        const url = await uploadToCloudinary(photo);
        uploadedUrls.push(url);
      }
      console.log("uploadedUrls", uploadedUrls);
      const donationData = {
        token,
        donationCategory,
        donationDescription,
        donorAddress: {
                  address: meetingPoint.address,
                  coordinates: new GeoPoint(meetingPoint.lat, meetingPoint.lng),
                  placeId: meetingPoint.placeId
                },
        pickupTime,
        donationPhotos: uploadedUrls,
      };
      console.log("before api call");

      const response = await axios.post('http://localhost:5000/api/user/donations', donationData);
      if(response.status === 201){
        Alert.alert('Success', 'Event added successfully!');
      }
      
      setIsLoading(false);
      Alert.alert('Success', 'Donation added successfully!');

      // Reset form
      setDonationCategory('groceries');
      setDonationDescription('');
      setDonorAddress('');
      setPickupTime('');
      setDonationPhotos([]);

    } catch (error) {
      setIsLoading(false);
      console.error('Error submitting donation:', error);

      // Enhanced error handling
      const errorMessage = error.response?.data?.message || 
                          'Failed to submit donation. Please check your connection and try again.';

      Alert.alert('Submission Error', errorMessage);
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.headerText}>Donate Items</Text>

        {/* Category selection */}
        <Text style={styles.label}>Category *</Text>
        <Picker
          selectedValue={donationCategory}
          onValueChange={setDonationCategory}
          style={styles.picker}
        >
          <Picker.Item label="Groceries" value="groceries" />
          <Picker.Item label="Clothing" value="clothing" />
          <Picker.Item label="Furniture" value="furniture" />
          <Picker.Item label="Others" value="others" />
        </Picker>

        {/* Description input */}
        <Text style={styles.label}>Description *</Text>
        <TextInput
          value={donationDescription}
          onChangeText={(text) => {
            setDonationDescription(text);
            if (text.trim()) {
              setErrors(prev => ({...prev, description: ''}));
            }
          }}
          placeholder="Describe the items you're donating"
          multiline
          style={[styles.input, errors.description ? styles.errorInput : {}]}
        />
        {errors.description ? (
          <Text style={styles.errorText}>{errors.description}</Text>
        ) : null}

        {/* Address input */}
        {/* <Text style={styles.label}>Address *</Text>
        <TextInput
          value={donorAddress}
          onChangeText={(text) => {
            setDonorAddress(text);
            if (text.trim()) {
              setErrors(prev => ({...prev, address: ''}));
            }
          }}
          placeholder="Enter the pickup address"
          style={[styles.input, errors.address ? styles.errorInput : {}]}
        />
        {errors.address ? (
          <Text style={styles.errorText}>{errors.address}</Text>
        ) : null} */}

        {Platform.OS === 'web' ? (
                   renderLocationInput(
                     'Pickup Address',
                     'meeting-point',
                     meetingPoint.location,
                     (text) => setMeetingPoint(prev => ({ ...prev, address: text })))
                 ) : (
                   renderMobileAutocomplete(
                     'Pickup Address',
                     meetingPointRef,
                     handleMeetingPointSelect
                   )
                 )}
       
         <Text style={styles.label}>Available Time & Date *</Text>
        <TextInput
          value={pickupTime}
          onChangeText={(text) => {
            setPickupTime(text);
            if (text.trim()) {
              setErrors(prev => ({...prev, pickupTime: ''}));
            }
          }}
          placeholder="Enter available pickup time and date"
          style={[styles.input, errors.pickupTime ? styles.errorInput : {}]}
        />
         {errors.pickupTime ? (
          <Text style={styles.errorText}>{errors.pickupTime}</Text>
        ) : null}


        {/* Photo upload */}
        <View style={styles.photoUploadContainer}>
          <TouchableOpacity 
            onPress={handleChoosePhotos} 
            style={styles.uploadButton}
          >
            <Text style={styles.uploadButtonText}>Upload Donation Photos (Max 5)</Text>
          </TouchableOpacity>

          {errors.photos ? (
            <Text style={styles.errorText}>{errors.photos}</Text>
          ) : null}

          {/* File input for web */}
          {Platform.OS === 'web' && (
            <input
              type="file"
              id="fileInput"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          )}
        </View>

        {/* Photo preview */}
        <Text style={styles.photoPreviewText}>
          {donationPhotos.length > 0 ? 'Selected Photos:' : 'No photos selected yet'}
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.photoScroll}
        >
          {donationPhotos.map((photoUri, index) => (
            <View key={index} style={styles.photoItem}>
              <Image 
                source={{ uri: photoUri }} 
                style={styles.photo}
              />
              <TouchableOpacity 
                onPress={() => {
                  const updatedPhotos = [...donationPhotos];
                  updatedPhotos.splice(index, 1);
                  setDonationPhotos(updatedPhotos);
                }}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Submit button */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={styles.loadingText}>Submitting donation...</Text>
          </View>
        ) : (
          <Button 
            title="Add Donation" 
            onPress={handleSubmit} 
            color="#007BFF"
          />
        )}

        {/* Required fields notice */}
        <Text style={styles.requiredFieldsText}>
          * Required fields
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  picker: {
    height: 50,
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  errorInput: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  photoUploadContainer: {
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#007BFF', 
    padding: 12, 
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10 
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  photoPreviewText: {
    fontWeight: '500',
    marginBottom: 10,
  },
  photoScroll: {
    marginBottom: 25,
  },
  photoItem: {
    marginRight: 10,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  deleteButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff0000',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
  },
  requiredFieldsText: {
    marginTop: 15,
    color: '#666',
    textAlign: 'center',
  },
});

export default DonationForm;
