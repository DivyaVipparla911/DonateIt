import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, FlatList, Button
} from 'react-native';
import axios from 'axios';

const ManageDonationBoxesScreen = () => {
  const [donationBoxes, setDonationBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonationBox, setSelectedDonationBox] = useState(null); 

  const handleSubmit = async () => {
    if (!name || !description || !address) {
      Alert.alert('Validation', 'Please fill all required fields.');
      return;
    }
  };

  useEffect(() => {
  const fetchDonationBoxes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/user/donation-boxes');
      setDonationBoxes(response.data);
    } catch (error) {
      console.error('Error fetching donation boxes:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchDonationBoxes();
}, []);

  const renderDonationBox = ({ item }) => (
      <TouchableOpacity onPress={() => setSelectedDonationBox(item)}>
        <View style={{ padding: 10, marginVertical: 5, backgroundColor: '#f0f0f0' }}>
          <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
          <Text>{item.description}</Text>
          <Text>Location: {item.address}</Text>
        </View>
      </TouchableOpacity>
    );
  
    if (selectedDonationBox) {
      return (
        <View style={{ padding: 20, flex: 1 }}>
          <TouchableOpacity onPress={() => setSelectedDonationBox(null)} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{selectedDonationBox.name}</Text>
          <Text>Location: {selectedDonationBox?.address}</Text>
          <Text style={{ marginTop: 10 }}>Type: {selectedDonationBox.type}</Text>
          <Text>Hours: {(selectedDonationBox.hours)}</Text>
          <Button title="Delete" color="red"  />
        </View>
      );
    }

  return (
   <View style={{ padding: 20, flex: 1 }}>
         <Text style={{ fontSize: 18, marginBottom: 10 }}>Welcome!</Text>
         {loading ? (
           <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20 }} />
         ) : (
           <FlatList
             data={donationBoxes}
             keyExtractor={(item) => item._id}
             renderItem={renderDonationBox}
             contentContainerStyle={{ marginTop: 20 }}
           />
         )}
       </View>
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

export default ManageDonationBoxesScreen;
