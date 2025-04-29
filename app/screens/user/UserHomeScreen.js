import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { auth } from '../../firebaseConfig';
import axios from 'axios';

export default function HomeScreen({ route, navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const logout = async () => {
        await auth.signOut();
      };
  
  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/user/events'); 
      const data = await response.data;
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const renderEvent = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedEvent(item)}>
      <View style={{ padding: 10, marginVertical: 5, backgroundColor: '#f0f0f0' }}>
        <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
        <Text>{item.description}</Text>
        <Text>{new Date(item.date).toLocaleDateString()}</Text>
        <Text>Location: {item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  if (selectedEvent) {
    return (
      <View style={{ padding: 20, flex: 1 }}>
        <TouchableOpacity onPress={() => setSelectedEvent(null)} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{selectedEvent.name}</Text>
        <Text style={{ marginTop: 10 }}>Description: {selectedEvent.description}</Text>
        <Text>Date: {new Date(selectedEvent.date).toLocaleDateString()}</Text>
        <Text>Location: {selectedEvent.location}</Text>
        <Button title="Chat with Organizer"/>
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
