import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { auth } from '../../firebaseConfig'; 
import { getIdToken } from 'firebase/auth';

const DonationForm = () => {
  const [donorName, setDonorName] = useState('');
  const [donationCategory, setDonationCategory] = useState('groceries');
  const [donationDescription, setDonationDescription] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [donationPhotos, setDonationPhotos] = useState([]);

  // Request permission for image picker
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photos to select images.');
        return false;
      }
    } else if (Platform.OS === 'ios') {
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

    // Launch the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaType: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsMultipleSelection: true, // Allow multiple selection if needed
    });

    if (result.cancelled) {
      console.log('User cancelled photo picker');
    } else {
      const selectedPhotos = result.assets.map((asset) => asset.uri);
      setDonationPhotos(selectedPhotos); // Set the selected photos to state
    }
  };

  // Handle image picker based on platform
  const handleChoosePhotos = Platform.select({
    ios: handleChoosePhotosMobile,
    android: handleChoosePhotosMobile,
    web: () => document.getElementById('fileInput').click(), // Trigger file input for web
  });

  // Handle file change for web
  const handleFileChange = async (event) => {
    const files = event.target.files;
    const fileArray = Array.from(files).map(file => URL.createObjectURL(file)); // Convert file to image URL
    setDonationPhotos(fileArray);
  };

  const handleSubmit = async () => {
    if (
      !donorName ||
      !donationCategory ||
      !donationDescription ||
      !donorAddress
    ) {
      Alert.alert('Error', 'Please fill all the fields');
      return;
    }
  
    const user = auth.currentUser;
  
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a donation.');
      return;
    }
  
    try {
      const token = await user.getIdToken();  // use user.getIdToken() directly
  
      const donationData = {
        token,
        donorName,
        donationCategory,
        donationDescription,
        donorAddress,
        donationPhotos,
      };
  
      await axios.post('http://localhost:5000/api/user/donations', donationData);
  
      Alert.alert('Success', 'Donation added successfully!');
      console.log('Donation Submitted:', donationData);
  
      // Reset form
      setDonorName('');
      setDonationCategory('groceries');
      setDonationDescription('');
      setDonorAddress('');
      setDonationPhotos([]);
  
    } catch (error) {
      console.error('Error submitting donation:', error);
      Alert.alert('Submission Error', error.response?.data?.message || error.message);
    }
  };
  

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f4f4f4' }}>
      <Text style={{ fontSize: 24, textAlign: 'center', marginBottom: 20 }}>Donate Items</Text>

      <Text>Your Name</Text>
      <TextInput
        value={donorName}
        onChangeText={setDonorName}
        placeholder="Enter your name"
        style={{ height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 10, paddingLeft: 8 }}
      />

      <Text>Category</Text>
      <Picker
        selectedValue={donationCategory}
        onValueChange={setDonationCategory}
        style={{ height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 10 }}
      >
        <Picker.Item label="Groceries" value="groceries" />
        <Picker.Item label="Clothing" value="clothing" />
        <Picker.Item label="Furniture" value="furniture" />
        <Picker.Item label="Others" value="others" />
      </Picker>

      <Text>Description</Text>
      <TextInput
        value={donationDescription}
        onChangeText={setDonationDescription}
        placeholder="Describe the items you're donating"
        multiline
        style={{ height: 80, borderColor: '#ccc', borderWidth: 1, marginBottom: 10, paddingLeft: 8 }}
      />

      <Text>Address</Text>
      <TextInput
        value={donorAddress}
        onChangeText={setDonorAddress}
        placeholder="Enter your address"
        style={{ height: 40, borderColor: '#ccc', borderWidth: 1, marginBottom: 10, paddingLeft: 8 }}
      />

      <TouchableOpacity onPress={handleChoosePhotos} style={{ marginBottom: 20 }}>
        <Text style={{ color: '#007BFF' }}>Upload Donation Photos (Max 5)</Text>
      </TouchableOpacity>

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

      {/* Displaying selected images side by side */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {donationPhotos.length > 0 ? (
          donationPhotos.map((photoUri, index) => (
            <Image key={index} source={{ uri: photoUri }} style={{ width: 100, height: 100, marginRight: 10 }} />
          ))
        ) : (
          <Text>No photos selected yet.</Text>
        )}
      </ScrollView>

      <Button title="Add Donation" onPress={handleSubmit} />
    </View>
  );
};

export default DonationForm;
