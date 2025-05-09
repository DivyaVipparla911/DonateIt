import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { auth, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const AddDonationScreen = () => {
  const [category, setCategory] = useState('groceries');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need permission to access your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const selected = result.assets.slice(0, 5 - photos.length);
      setPhotos([...photos, ...selected]);
    }
  };

  const handleSubmit = async () => {
    if (!description || !address || photos.length === 0) {
      Alert.alert('Validation', 'Please fill in all required fields and upload at least one photo.');
      return;
    }

    setLoading(true);

    try {
      const uploadedUrls = [];
      for (const photo of photos) {
        const imgRef = ref(storage, `donations/${Date.now()}_${photo.fileName || 'image.jpg'}`);
        const img = await fetch(photo.uri);
        const blob = await img.blob();
        await uploadBytes(imgRef, blob);
        const downloadURL = await getDownloadURL(imgRef);
        uploadedUrls.push(downloadURL);
      }

      const token = await auth.currentUser.getIdToken();
      await axios.post('http://localhost:5000/api/user/donations', {
        category,
        description,
        address,
        photos: uploadedUrls,
        token,
      });

      Alert.alert('Success', 'Donation submitted!');
      setCategory('groceries');
      setDescription('');
      setAddress('');
      setPhotos([]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to submit donation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Donate Items</Text>

      <Text style={styles.label}>Category *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={category}
          onValueChange={(value) => setCategory(value)}
          style={styles.picker}
        >
          <Picker.Item label="Groceries" value="groceries" />
          <Picker.Item label="Clothes" value="clothes" />
          <Picker.Item label="Books" value="books" />
          <Picker.Item label="Electronics" value="electronics" />
        </Picker>
      </View>

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Describe the items you're donating"
        multiline
      />

      <Text style={styles.label}>Address *</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="Enter your address"
      />

      <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
        <Text style={styles.uploadButtonText}>Upload Donation Photos (Max 5)</Text>
      </TouchableOpacity>

      {photos.length > 0 ? (
        <View style={styles.photoPreview}>
          {photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo.uri }} style={styles.photo} />
          ))}
        </View>
      ) : (
        <Text style={styles.noPhotos}>No photos selected yet</Text>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>ADD DONATION</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footer}>* Required fields</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111',
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  picker: {
    height: 48,
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#2b7de9',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  photoPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  photo: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 8,
  },
  noPhotos: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: '#2b7de9',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  footer: {
    marginTop: 10,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
});

export default AddDonationScreen;
