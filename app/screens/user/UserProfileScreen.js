import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, Button, FlatList, TouchableOpacity } from 'react-native';
import { auth } from '../../firebaseConfig';
import axios from 'axios';

export default function UserProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null); 
  const [error, setError] = useState(null);
   const logout = async () => {
      await auth.signOut();
    };

  useEffect(() => {
    const fetchProfileAndDonations = async () => {
      try {
        const token = await auth.currentUser.getIdToken();

        // Fetch user profile
        const profileRes = await axios.get('http://localhost:5000/api/user/user-details', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data);

        // Fetch user donations
        const donationsRes = await axios.get('http://localhost:5000/api/user/donations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDonations(donationsRes.data);

      } catch (err) {
        const message = err.response?.data?.message || err.message;
        Alert.alert('Error', message);
        setError(message);
      }
    };

    fetchProfileAndDonations();
  }, []);

  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const renderDonation = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedDonation(item)}>
      <View style={{ padding: 10, marginVertical: 5, backgroundColor: '#f0f0f0' }}>
        <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
        <Text>{item.description}</Text>
        <Text>Address: {item.address}</Text>
      </View>
    </TouchableOpacity>
  );

   if (selectedDonation) {
      return (
        <View style={{ padding: 20, flex: 1 }}>
          <TouchableOpacity onPress={() => setSelectedDonation(null)} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{selectedDonation.name}</Text>
          <Text style={{ marginTop: 10 }}>Description: {selectedDonation.description}</Text>
          <Button title="Edit"/>
        </View>
      );
    }

  return (
    <View style={{ padding: 20 }}>
      <Text>Email: {profile.email}</Text>
      <Text>Name: {profile.name}</Text>
      <Text>Date of Birth: {new Date(profile.dateOfBirth).toDateString()}</Text>
      <Text>Address: {profile.address}</Text>

      <Text style={{ marginTop: 20, fontWeight: 'bold', fontSize: 16 }}>Your Donations:</Text>
      {donations.length === 0 ? (
        <Text style={{ marginTop: 10 }}>No donations posted yet.</Text>
      ) : (
        <FlatList
          data={donations}
          keyExtractor={(item) => item._id}
          renderItem={renderDonation}
          contentContainerStyle={{ marginTop: 20 }}
        />
      )}

      <Button title="Logout" onPress={logout} />
    </View>
  );
}
