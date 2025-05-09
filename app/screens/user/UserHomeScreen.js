import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, ActivityIndicator, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

export default function UserHomeScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState(null);
  const [organizerStatus, setOrganizerStatus] = useState({
    exists: false,
    name: 'Event Organizer',
    email: ''
  });

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/user/events', {
        timeout: 10000
      });
      
      if (!response.data) {
        throw new Error('Empty response from server');
      }

      const eventsWithOrganizerStatus = await Promise.all(
        response.data.map(async (event) => {
          try {
            const exists = event.organizer_id 
              ? await verifyOrganizer(event.organizer_id)
              : false;
            return {
              ...event,
              organizerId: event.organizer_id,
              organizerExists: exists,
              organizerName: exists ? (await getDoc(doc(db, 'users', event.organizer_id))).data().displayName || 'Organizer' : 'Organizer'
            };
          } catch (err) {
            console.error('Error processing event:', err);
            return {
              ...event,
              organizerId: event.organizer_id,
              organizerExists: false,
              organizerName: 'Organizer',
              error: true
            };
          }
        })
      );

      setEvents(eventsWithOrganizerStatus);
    } catch (error) {
      setError(error.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const verifyOrganizer = async (organizerId) => {
    try {
      const organizerRef = doc(db, 'users', organizerId);
      const organizerSnap = await getDoc(organizerRef);
      return organizerSnap.exists();
    } catch (error) {
      console.error('Organizer verification failed:', error);
      return false;
    }
  };

  const handleSelectEvent = async (event) => {
    setSelectedEvent(event);
    
    if (event.organizerId) {
      try {
        const organizerRef = doc(db, 'users', event.organizerId);
        const organizerSnap = await getDoc(organizerRef);
        
        if (organizerSnap.exists()) {
          const organizerData = organizerSnap.data();
          setOrganizerStatus({
            exists: true,
            name: organizerData.displayName || 'Event Organizer',
            email: organizerData.email || ''
          });
        } else {
          setOrganizerStatus({
            exists: false,
            name: 'Event Organizer',
            email: ''
          });
        }
      } catch (error) {
        console.error('Organizer fetch error:', error);
        setOrganizerStatus({
          exists: false,
          name: 'Event Organizer',
          email: ''
        });
      }
    }
  };

  const handleChatWithOrganizer = async () => {
    setChatLoading(true);
    try {
      if (!selectedEvent?.organizerId) {
        throw new Error('This event has no organizer assigned');
      }

      const currentUser = auth.currentUser;
      if (!currentUser?.uid) {
        throw new Error('Please sign in to chat');
      }

      const chatId = `${selectedEvent._id}_${currentUser.uid}_${selectedEvent.organizerId}`;

      const defaultOrganizerInfo = {
        name: 'Event Organizer',
        email: '',
        photoURL: null
      };

      let organizerInfo = defaultOrganizerInfo;
      try {
        const organizerRef = doc(db, 'users', selectedEvent.organizerId);
        const organizerSnap = await getDoc(organizerRef);
        if (organizerSnap.exists()) {
          const data = organizerSnap.data();
          organizerInfo = {
            name: data.displayName || data.name || defaultOrganizerInfo.name,
            email: data.email || defaultOrganizerInfo.email,
            photoURL: data.photoURL || defaultOrganizerInfo.photoURL
          };
        }
      } catch (error) {
        console.log('Using default organizer info due to error:', error);
      }

      await setDoc(doc(db, 'chats', chatId), {
        id: chatId,
        participants: [currentUser.uid, selectedEvent.organizerId],
        participantInfo: {
          [currentUser.uid]: {
            name: currentUser.displayName || 'User',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || null
          },
          [selectedEvent.organizerId]: organizerInfo
        },
        eventId: selectedEvent._id,
        eventName: selectedEvent.name,
        createdAt: serverTimestamp(),
        lastMessage: "Chat started",
        lastMessageAt: serverTimestamp()
      }, { merge: true });

      navigation.navigate('Chats', {
        screen: 'ChatList',
        params: { refresh: Date.now() }
      });
      
      setTimeout(() => {
        navigation.navigate('Chats', {
          screen: 'ChatScreen',
          params: {
            chatId,
            otherUserId: selectedEvent.organizerId,
            otherUserName: organizerInfo.name,
            eventName: selectedEvent.name
          }
        });
      }, 300);

    } catch (error) {
      console.error('Chat creation failed:', error);
      Alert.alert(
        'Error',
        error.message,
        [{ text: 'OK' }]
      );
    } finally {
      setChatLoading(false);
    }
  };

  const renderEvent = ({ item }) => (
    <TouchableOpacity 
      onPress={() => handleSelectEvent(item)}
      style={styles.eventCard}
    >
      <Text style={styles.eventTitle}>{item.name}</Text>
      <Text style={styles.eventBy}>By {item.organizerName}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
      <View style={styles.eventDetails}>
        <Text style={styles.eventDate}>• {new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.eventLocation}>• {item.location}</Text>
      </View>
      <View style={styles.divider} />
    </TouchableOpacity>
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchEvents);
    fetchEvents();
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading events</Text>
        <Button 
          title="Retry" 
          onPress={fetchEvents}
        />
      </View>
    );
  }

  if (selectedEvent) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          onPress={() => setSelectedEvent(null)} 
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.eventHeader}>{selectedEvent.name}</Text>
        <Text style={styles.eventBy}>By {organizerStatus.name}</Text>
        <Text style={styles.eventDescription}>{selectedEvent.description}</Text>
        
        <View style={styles.eventDetails}>
          <Text style={styles.eventDate}>• {new Date(selectedEvent.date).toLocaleDateString()}</Text>
          <Text style={styles.eventLocation}>• {selectedEvent.location}</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          {chatLoading ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <Button 
              title="Chat with Organizer" 
              onPress={handleChatWithOrganizer}
              color="#007AFF"
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Donatelt</Text>
      
      {events.length === 0 ? (
        <View style={styles.centered}>
          <Text>No events available</Text>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    color: 'red',
    marginBottom: 20
  },
  listContent: {
    paddingBottom: 20
  },
  eventCard: {
    marginBottom: 20
  },
  eventTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
    color: '#000'
  },
  eventBy: {
    color: '#666',
    marginBottom: 10,
    fontSize: 14
  },
  eventDescription: {
    color: '#333',
    marginBottom: 10,
    fontSize: 14
  },
  eventDetails: {
    flexDirection: 'row',
    marginBottom: 15
  },
  eventDate: {
    color: '#666',
    marginRight: 10,
    fontSize: 14
  },
  eventLocation: {
    color: '#666',
    fontSize: 14
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10
  },
  backButton: {
    marginBottom: 20
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF'
  },
  eventHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000'
  },
  buttonContainer: {
    marginTop: 30
  }
});