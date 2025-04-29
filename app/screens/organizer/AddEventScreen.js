import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import axios from 'axios';
import { auth } from '../../firebaseConfig'; 
import { getIdToken } from 'firebase/auth';

const predefinedItems = ['Clothes', 'Toys', 'Books', 'Food', 'Electronics'];

const AddEventScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    date: '',
    items_accepted: [],
  });

  const handleTextChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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
  
      const payload = {
        token,
        name: formData.name,
        description: formData.description,
        location: formData.location,
        date: formData.date,
        items_accepted: formData.items_accepted,
      };
  
      await axios.post('http://localhost:5000/api/user/events', payload);
  
      Alert.alert('Success', 'Event added successfully!');

      setFormData({
        name: '',
        description: '',
        location: '',
        date: '',
        items_accepted: [],
      });
      
    } catch (err) {
      console.error('Submission error:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to add event.');
    }
  };
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {['name', 'description', 'location', 'date'].map((field) => (
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
