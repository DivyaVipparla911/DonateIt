import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert
} from 'react-native';
import axios from 'axios';

const AddDonationBoxScreen = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [availableHours, setAvailableHours] = useState('');
  const [itemsAccepted, setItemsAccepted] = useState('');

  const handleSubmit = async () => {
    if (!name || !description || !address) {
      Alert.alert('Validation', 'Please fill all required fields.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/donation-boxes', {
        name,
        description,
        address,
        availableHours,
        itemsAccepted: itemsAccepted.split(',').map(item => item.trim()),
      });

      Alert.alert('Success', 'Donation box created!');
      setName('');
      setDescription('');
      setAddress('');
      setAvailableHours('');
      setItemsAccepted('');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not create donation box.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Donation Box</Text>

      <TextInput
        style={styles.input}
        placeholder="Name *"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Description *"
        value={description}
        onChangeText={setDescription}
      />

      <TextInput
        style={styles.input}
        placeholder="Address *"
        value={address}
        onChangeText={setAddress}
      />

      <TextInput
        style={styles.input}
        placeholder="Available Hours (e.g. 9 AM - 5 PM)"
        value={availableHours}
        onChangeText={setAvailableHours}
      />

      <TextInput
        style={styles.input}
        placeholder="Items Accepted (comma separated)"
        value={itemsAccepted}
        onChangeText={setItemsAccepted}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#2b7de9',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default AddDonationBoxScreen;
