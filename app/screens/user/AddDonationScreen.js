import React, { useState } from 'react';
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
  ActivityIndicator 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { auth } from '../../firebaseConfig'; 

const DonationForm = () => {
  const [donationCategory, setDonationCategory] = useState('groceries');
  const [donationDescription, setDonationDescription] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [donationPhotos, setDonationPhotos] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    description: '',
    address: '',
    photos: ''
  });

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
    const newErrors = { description: '', address: '', photos: '' };

    if (!donationDescription.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (!donorAddress.trim()) {
      newErrors.address = 'Address is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const uploadToCloudinary = async (photo) => {
    const data = new FormData();

  if (Platform.OS === 'web') {
    data.append('file', photo); 
  } else {
    data.append('file', {
      uri: photo,
      name: 'donation.jpg',
      type: 'image/jpeg',
    });
  }
    data.append('upload_preset', 'donations_preset'); 
    data.append('cloud_name', 'do0u4ae7b'); 

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/do0u4ae7b/image/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      return result.secure_url; 
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
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
        donorAddress,
        donationPhotos: uploadedUrls,
      };

      const response = await axios.post('http://localhost:5000/api/user/donations', donationData);

      setIsLoading(false);
      Alert.alert('Success', 'Donation added successfully!');

      // Reset form
      setDonationCategory('groceries');
      setDonationDescription('');
      setDonorAddress('');
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
      <View style={{ flex: 1, padding: 20, backgroundColor: '#f4f4f4' }}>
        <Text style={{ fontSize: 24, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' }}>
          Donate Items
        </Text>

        {/* Category selection */}
        <Text style={{ fontWeight: '500', marginBottom: 5 }}>Category *</Text>
        <Picker
          selectedValue={donationCategory}
          onValueChange={setDonationCategory}
          style={{ 
            height: 50, 
            borderColor: '#ccc', 
            borderWidth: 1, 
            marginBottom: 15,
            backgroundColor: '#fff',
            borderRadius: 5 
          }}
        >
          <Picker.Item label="Groceries" value="groceries" />
          <Picker.Item label="Clothing" value="clothing" />
          <Picker.Item label="Furniture" value="furniture" />
          <Picker.Item label="Others" value="others" />
        </Picker>

        {/* Description input */}
        <Text style={{ fontWeight: '500', marginBottom: 5 }}>Description *</Text>
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
          style={{ 
            minHeight: 80, 
            borderColor: errors.description ? '#ff0000' : '#ccc', 
            borderWidth: 1, 
            marginBottom: errors.description ? 5 : 15, 
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 8,
            paddingBottom: 8,
            backgroundColor: '#fff',
            borderRadius: 5,
            textAlignVertical: 'top'
          }}
        />
        {errors.description ? (
          <Text style={{ color: 'red', marginBottom: 10 }}>{errors.description}</Text>
        ) : null}

        {/* Address input */}
        <Text style={{ fontWeight: '500', marginBottom: 5 }}>Address *</Text>
        <TextInput
          value={donorAddress}
          onChangeText={(text) => {
            setDonorAddress(text);
            if (text.trim()) {
              setErrors(prev => ({...prev, address: ''}));
            }
          }}
          placeholder="Enter the pickup address"
          style={{ 
            height: 50, 
            borderColor: errors.address ? '#ff0000' : '#ccc', 
            borderWidth: 1, 
            marginBottom: errors.address ? 5 : 15, 
            paddingLeft: 10,
            paddingRight: 10,
            backgroundColor: '#fff',
            borderRadius: 5
          }}
        />
        {errors.address ? (
          <Text style={{ color: 'red', marginBottom: 10 }}>{errors.address}</Text>
        ) : null}

        {/* Photo upload */}
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity 
            onPress={handleChoosePhotos} 
            style={{ 
              backgroundColor: '#007BFF', 
              padding: 12, 
              borderRadius: 5,
              alignItems: 'center',
              marginBottom: 10 
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '500' }}>
              Upload Donation Photos (Max 5)
            </Text>
          </TouchableOpacity>

          {errors.photos ? (
            <Text style={{ color: 'red', marginBottom: 10 }}>{errors.photos}</Text>
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
        <Text style={{ fontWeight: '500', marginBottom: 10 }}>
          {donationPhotos.length > 0 ? 'Selected Photos:' : 'No photos selected yet'}
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ marginBottom: 25 }}
        >
          {donationPhotos.map((photoUri, index) => (
            <View key={index} style={{ marginRight: 10 }}>
              <Image 
                source={{ uri: photoUri }} 
                style={{ 
                  width: 100, 
                  height: 100, 
                  borderRadius: 5,
                  borderWidth: 1,
                  borderColor: '#ddd' 
                }} 
              />
              <TouchableOpacity 
                onPress={() => {
                  const updatedPhotos = [...donationPhotos];
                  updatedPhotos.splice(index, 1);
                  setDonationPhotos(updatedPhotos);
                }}
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: '#ff0000',
                  borderRadius: 10,
                  width: 20,
                  height: 20,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Submit button */}
        {isLoading ? (
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <ActivityIndicator size="large" color="#007BFF" />
            <Text style={{ marginTop: 10 }}>Submitting donation...</Text>
          </View>
        ) : (
          <Button 
            title="Add Donation" 
            onPress={handleSubmit} 
            color="#007BFF"
          />
        )}

        {/* Required fields notice */}
        <Text style={{ marginTop: 15, color: '#666', textAlign: 'center' }}>
          * Required fields
        </Text>
      </View>
    </ScrollView>
  );
};

export default DonationForm;