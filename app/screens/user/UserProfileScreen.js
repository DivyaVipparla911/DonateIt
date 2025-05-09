import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  Button,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { auth } from '../../firebaseConfig';
import axios from 'axios';

export default function UserProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [error, setError] = useState(null);

  const logout =  async() => {
    await auth.signOut();
  };

  useEffect(() => {
    const fetchProfileAndDonations = async () => {
      try {
        const currentUser = auth.currentUser;
        const token = await currentUser.getIdToken();

        // Fetch profile
        const profileRes = await axios.get('http://localhost:5000/api/user/user-details', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data);

        // Fetch donations
        const donationsRes = await axios.get('http://localhost:5000/api/user/donations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userDonations = donationsRes.data.filter(
          (donation) => donation.uid === currentUser.uid
        );
        setDonations(userDonations);
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        Alert.alert('Error', message);
        setError(message);
      }
    };

    fetchProfileAndDonations();
  }, []);

  if (error) {
    return <Text style={{ color: 'red', padding: 20 }}>{error}</Text>;
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const renderDonation = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedDonation(item)}>
      <View style={{ padding: 10, marginVertical: 5, backgroundColor: '#f0f0f0', borderRadius: 6 }}>
        <Text style={{ fontWeight: 'bold' }}>{item.category || 'Untitled'}</Text>
        <Text numberOfLines={2}>{item.donationDescription}</Text>
      </View>
    </TouchableOpacity>
  );

  if (selectedDonation) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 20 }}>
        <TouchableOpacity onPress={() => setSelectedDonation(null)} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 24 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          {selectedDonation.category || 'Donation'}
        </Text>
        <Text style={{ marginTop: 10 }}>Description: {selectedDonation.description}</Text>
        <Text style={{ marginTop: 5 }}>Address: {selectedDonation.address}</Text>
        {selectedDonation.images?.length > 0 && (
          <ScrollView horizontal style={{ marginTop: 15 }}>
            {selectedDonation.images.map((photoUrl, idx) => (
              <Image
                key={idx}
                source={{ uri: photoUrl }}
                style={{ width: 100, height: 100, marginRight: 10, borderRadius: 5 }}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 20 }}>
      <Text>Email: {profile.email}</Text>
      <Text>Name: {profile.name || 'N/A'}</Text>

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

      <View style={{ marginTop: 30 }}>
        <Button title="Logout" onPress={logout} color="#cc0000" />
      </View>
    </SafeAreaView>
  );
}
