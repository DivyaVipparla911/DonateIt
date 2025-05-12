import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
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
import { Ionicons } from '@expo/vector-icons';

const MAPS_KEY = "AIzaSyDw26V3Tw0g6tXKWX5ruHx8nAl6eJrn7vI";

const AddDonationScreen = () => {
  const [donationCategory, setDonationCategory] = useState('groceries');
  const [donationDescription, setDonationDescription] = useState('');
  const [donationPhotos, setDonationPhotos] = useState([]);
  const [pickupTime, setPickupTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    description: '',
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

  const handleChoosePhotosMobile = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaType: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (!result.canceled) {
        const selectedPhotos = result.assets.map((asset) => asset.uri);

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

  const handleChoosePhotos = Platform.select({
    ios: handleChoosePhotosMobile,
    android: handleChoosePhotosMobile,
    web: () => document.getElementById('fileInput').click(), 
  });

  const handleFileChange = async (event) => {
    const files = event.target.files;

    if (files.length > 5) {
      setErrors(prev => ({...prev, photos: 'Maximum 5 photos allowed'}));
      return;
    }

    const fileArray = Array.from(files);
    const fileUrls = fileArray.map(file => URL.createObjectURL(file));
    setDonationPhotos(fileUrls);
    setErrors(prev => ({...prev, photos: ''}));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { description: '', photos: '', pickupTime: '' };

    if (!donationDescription.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (!meetingPoint.address.trim()) {
      newErrors.address = 'Address is required';
      isValid = false;
    }

    if (!pickupTime.trim()) {
      newErrors.pickupTime = 'Available time and date is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // const uploadToCloudinary = async (photo) => {
  //   const data = new FormData();

  //   if (Platform.OS === 'web') {
  //     const response = await fetch(photo);
  //     const blob = await response.blob();
  //     data.append('file', blob);
  //   } else {
  //     const filename = photo.split('/').pop();
  //     const match = /\.(\w+)$/.exec(filename);
  //     const type = match ? `image/${match[1]}` : 'image/jpeg';

  //     data.append('file', {
  //       uri: photo,
  //       name: filename,
  //       type
  //     });
  //   }

  //   data.append('upload_preset', 'donations_preset');
  //   data.append('cloud_name', 'do0u4ae7b');

  //   try {
  //     const res = await fetch('https://api.cloudinary.com/v1_1/do0u4ae7b/image/upload', {
  //       method: 'POST',
  //       body: data,
  //     });

  //     const result = await res.json();
  //     if (result.secure_url) {
  //       return result.secure_url;
  //     } else {
  //       throw new Error(`Failed to upload image`);
  //     }
  //   } catch (error) {
  //     console.error(`Error uploading image`, error);
  //     throw new Error('Cloudinary upload failed. Please try again.');
  //   }
  // };

  const uploadToCloudinary = async (photoUri) => {
  // Different handling for web vs mobile
  let file;
  
  if (Platform.OS === 'web') {
    // For web - fetch the blob from the object URL
    const response = await fetch(photoUri);
    file = await response.blob();
  } else {
    // For mobile - create file object
    const filename = photoUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    file = {
      uri: photoUri,
      name: filename,
      type
    };
  }

  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'donations_preset');
  data.append('cloud_name', 'do0u4ae7b');

  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/do0u4ae7b/image/upload', {
      method: 'POST',
      body: data,
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Upload failed');
    return result.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to submit a donation.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const token = await user.getIdToken();
      const uploadPromises = donationPhotos.map(photo => 
      uploadToCloudinary(photo)
        .catch(error => {
          console.error(`Failed to upload image: ${error}`);
          return null; // Continue even if some uploads fail
        })
    );

    const uploadedUrls = (await Promise.all(uploadPromises))
      .filter(url => url !== null); // Remove failed uploads

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

      const response = await axios.post('http://localhost:5000/api/user/donations', donationData);
      if(response.status === 201){
        Alert.alert('Success', 'Donation added successfully!');
        
        // Reset form
        setDonationCategory('groceries');
        setDonationDescription('');
        setPickupTime('');
        setDonationPhotos([]);
        setMeetingPoint({
          address: '',
          lat: null,
          lng: null,
          placeId: null
        });
      }
    } catch (error) {
      console.error('Error submitting donation:', error);
      const errorMessage = error.response?.data?.message || 
                          'Failed to submit donation. Please check your connection and try again.';
      Alert.alert('Submission Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>Start your pickup Request</Text>

        {/* Category selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.pickerContainer}>
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
          </View>
        </View>

        {/* Description input */}
        <View style={styles.inputGroup}>
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
            placeholderTextColor="#888"
          />
          {errors.description ? (
            <Text style={styles.errorText}>{errors.description}</Text>
          ) : null}
        </View>

        {/* Address input */}
        <View style={styles.inputGroup}>
          {Platform.OS === 'web' ? (
            renderLocationInput(
              'Pickup Address',
              'meeting-point',
              meetingPoint.address,
              (text) => setMeetingPoint(prev => ({ ...prev, address: text }))
            )
          ) : (
            renderMobileAutocomplete(
              'Pickup Address',
              meetingPointRef,
              handleMeetingPointSelect
            )
          )}
          {errors.address ? (
            <Text style={styles.errorText}>{errors.address}</Text>
          ) : null}
        </View>

        {/* Pickup time */}
        <View style={styles.inputGroup}>
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
            placeholderTextColor="#888"
          />
          {errors.pickupTime ? (
            <Text style={styles.errorText}>{errors.pickupTime}</Text>
          ) : null}
        </View>

        {/* Photo upload */}
        <View style={styles.inputGroup}>
          <TouchableOpacity 
            onPress={handleChoosePhotos} 
            style={styles.uploadButton}
          >
            <Ionicons name="images" size={20} color="#000" style={styles.uploadIcon} />
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
        {donationPhotos.length > 0 && (
          <View style={styles.inputGroup}>
            <Text style={styles.photoPreviewText}>Selected Photos:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.photoScroll}
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
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Submit button */}
        <View style={styles.submitContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.loadingText}>Submitting donation...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={handleSubmit} 
              style={styles.submitButton}
            >
              <Text style={styles.submitButtonText}>Add Donation</Text>
            </TouchableOpacity>
          )}
        </View>

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
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 20,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
    color: '#000',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    backgroundColor: '#fff',
    color: '#000',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 5,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    fontSize: 16,
    color: '#000',
  },
  errorInput: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  uploadIcon: {
    marginRight: 10,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  photoPreviewText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  photoScroll: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  photoItem: {
    marginRight: 15,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#000',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  requiredFieldsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  autocompleteWrapper: {
    zIndex: 1,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginTop: 5,
  },
  placeDescription: {
    color: '#000',
    padding: 10,
  },
  placeItem: {
    padding: 10,
    color: '#000',
  },
});

export default AddDonationScreen;