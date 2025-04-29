import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, Button } from 'react-native';
import { auth } from '../../firebaseConfig';
import axios from 'axios';

export default function OrganizerProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const logout = async () => {
      await auth.signOut();
    };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await auth.currentUser.getIdToken();

        const res = await axios.get('http://localhost:5000/api/user/user-details', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfile(res.data);
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        Alert.alert('Error', message);
        setError(message);
      }
    };

    fetchProfile();
  }, []);

  if (error) return <Text style={{ color: 'red' }}>{error}</Text>;

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Email: {profile.email}</Text>
      <Text>Name: {profile.name}</Text>
      <Text>Date of Birth: {new Date(profile.dateOfBirth).toDateString()}</Text>
      <Text>Address: {profile.address}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
