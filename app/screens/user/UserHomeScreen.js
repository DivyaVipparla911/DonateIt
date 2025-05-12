import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function UserHomeScreen({ navigation }) {
  // State initialization
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
      style={[
        styles.eventCard,
        selectedEvent?._id === item._id && styles.selectedEventCard
      ]}
    >
      <View style={styles.eventHeaderContainer}>
        <Text style={styles.eventTitle}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={20} color="#555" />
      </View>
      <Text style={styles.eventBy}>Hosted by {item.organizerName}</Text>
      <Text style={styles.eventDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.eventDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar" size={14} color="#555" />
          <Text style={styles.detailText}>
            {new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="location" size={14} color="#555" />
          <Text style={styles.detailText} numberOfLines={1}>
            {item.location.address}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchEvents);
    fetchEvents();
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={50} color="#000" />
        <Text style={styles.errorText}>Error loading events</Text>
        <Text style={styles.errorSubText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchEvents}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (selectedEvent) {
    return (
      <View style={styles.detailContainer}>
        <TouchableOpacity 
          onPress={() => setSelectedEvent(null)} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>All Events</Text>
        </TouchableOpacity>
        
        <View style={styles.eventImagePlaceholder} />
        
        <Text style={styles.detailTitle}>{selectedEvent.name}</Text>
        <Text style={styles.detailOrganizer}>Organized by {organizerStatus.name}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.detailDescription}>{selectedEvent.description}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color="#000" style={styles.detailIcon} />
            <View>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color="#000" style={styles.detailIcon} />
            <View>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{selectedEvent.location.address}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          {chatLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={handleChatWithOrganizer}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
              <Text style={styles.chatButtonText}>Message Organizer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Upcoming Events</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar" size={50} color="#aaa" />
          <Text style={styles.emptyText}>No events available</Text>
          <Text style={styles.emptySubText}>Check back later for new events</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchEvents}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          renderItem={renderEvent}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedEventCard: {
    borderColor: '#000',
  },
  eventHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  eventBy: {
    color: '#555',
    fontSize: 14,
    marginBottom: 8,
  },
  eventDescription: {
    color: '#333',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  eventDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    color: '#555',
    fontSize: 13,
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  errorSubText: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    marginBottom: 24,
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  eventImagePlaceholder: {
    height: 200,
    backgroundColor: '#eee',
    width: '100%',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginHorizontal: 16,
    marginTop: 16,
  },
  detailOrganizer: {
    fontSize: 16,
    color: '#555',
    marginHorizontal: 16,
    marginBottom: 24,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIcon: {
    marginRight: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  chatButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  chatButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
});