import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

export default function HomeScreen() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/user/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const deleteEvent = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/events/${selectedEvent._id}`,
        selectedEvent
      );
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting Event:', error);
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/events/${selectedEvent._id}`,
        editedDonation
      );
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Error deleting Event:', error);
    }
  };

  const renderEvent = ({ item }) => (
    <TouchableOpacity onPress={() => setSelectedEvent(item)}>
      <View style={styles.donationItem}>
        <Text style={styles.donationTitle}>{item.name}</Text>
        <Text style={styles.donationText}>{item.description}</Text>
        <Text style={styles.donationText}>Location: {item.location.address || ""}</Text>
      </View>
    </TouchableOpacity>
  );

  if (selectedEvent) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={() => setSelectedEvent(null)} 
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.detailTitle}>{selectedEvent.name}</Text>
        
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailText}>{selectedEvent.description}</Text>

          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailText}>{selectedEvent.location.address}</Text>
   
        </View>

        <View style={styles.buttonGroup}>          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={deleteEvent}
          >
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Event Management</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#000000" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No events found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000000',
  },
  listContainer: {
    paddingBottom: 20,
  },
  donationItem: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#000000',
  },
  donationText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 3,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 18,
    color: '#000000',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000000',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000000',
  },
  detailContainer: {
    marginBottom: 30,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#000000',
  },
  detailText: {
    fontSize: 16,
    color: '#333333',
  },
  infoContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    color: '#000000',
  },
  infoText: {
    fontSize: 16,
    marginBottom: 15,
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  editButton: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666666',
  },
});