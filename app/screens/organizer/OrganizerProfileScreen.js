import React, { useEffect, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, Button, FlatList, TouchableOpacity } from 'react-native';
import { auth } from '../../firebaseConfig';
import axios from 'axios';

export default function OrganizerProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const logout = async () => {
      await auth.signOut();
    };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        const token = await currentUser.getIdToken();

        const res = await axios.get('http://localhost:5000/api/user/user-details', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const eventsRes = await axios.get('http://localhost:5000/api/user/events', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userEvents = eventsRes.data.filter(
          (event) => event.organizer_id === currentUser.uid
        );
        setEvents(userEvents);
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

   const renderEvent = ({ item }) => (
      <TouchableOpacity onPress={() => setSelectedEvent(item)}>
        <View style={{ padding: 10, marginVertical: 5, backgroundColor: '#f0f0f0' }}>
          <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
          <Text>{item.description}</Text>
          <Text>Address: {item.address}</Text>
        </View>
      </TouchableOpacity>
    );

     if (selectedEvent) {
      return (
        <View style={{ padding: 20, flex: 1 }}>
          <TouchableOpacity onPress={() => setSelectedEvent(null)} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 24 }}>← Back to Events</Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>{selectedEvent.name}</Text>
          <Text style={{ marginBottom: 5 }}>Description: {selectedEvent.description}</Text>
          <Text style={{ marginBottom: 5 }}>Location: {selectedEvent.location}</Text>
          <Text style={{ marginBottom: 5 }}>
            Date: {new Date(selectedEvent.date).toLocaleDateString()}
          </Text>
          <Text style={{ marginBottom: 5 }}>
            Items Accepted: {selectedEvent.items_accepted?.join(', ') || 'None'}
          </Text>

          <Button title="Edit" />
        </View>
      );
    }


  return (
    <View style={{ padding: 20 }}>
      <Text>Email: {profile.email}</Text>
      <Text>Name: {profile.name}</Text>
      <Text style={{ marginTop: 20, fontWeight: 'bold', fontSize: 16 }}>Your Events:</Text>
            {events.length === 0 ? (
              <Text style={{ marginTop: 10 }}>No events posted yet.</Text>
            ) : (
              <FlatList
                data={events}
                keyExtractor={(item) => item._id}
                renderItem={renderEvent}
                contentContainerStyle={{ marginTop: 20 }}
              />
            )}
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
