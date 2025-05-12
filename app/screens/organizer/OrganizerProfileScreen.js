import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Image
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from "firebase/auth";


const OrganizerProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_USER_ID = "VlNgmUErG7QjqCC5hhLkPoyDb0P2";

  const logout = async () => {
    await auth.signOut();
  };

  const handleContactAdmin = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to contact admin");
        return;
      }

      const chatData = await getOrCreateAdminChat(
        ADMIN_USER_ID, 
        "Admin", 
        selectedEvent ? selectedEvent._id : null,
        selectedEvent ? `Event: ${selectedEvent.name || 'Untitled'}` : "General Inquiry"
      );

      navigation.navigate('Chat', {
        screen: 'ChatScreen',
        params: {
          chatId: chatData.chatId,
          otherUserId: ADMIN_USER_ID,
          otherUserName: "Admin",
          eventName: chatData.eventName
        }
      });
      
    } catch (error) {
      console.error("Error contacting admin:", error);
      Alert.alert("Error", "Failed to open chat with admin. Please try again later.");
    }
  };

  const handleResetPassword = async () => {
        try {
          const user = auth.currentUser;
          if (!user) {
            Alert.alert("Error", "User not authenticated");
            return;
          }
          await sendPasswordResetEmail(auth, user.email);
          Alert.alert("Success", "Password reset email sent. Please check your inbox.");
        } catch (error) {
          console.error("Error sending password reset email:", error);
          Alert.alert("Error", "Failed to send password reset email");
        }
      };

  const checkExistingAdminChat = async (adminUserId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      const chatsRef = collection(db, "chats");
      const chatKey = [currentUser.uid, adminUserId].sort().join('_');
      
      const chatDocsQuery = await getDocs(query(
        chatsRef,
        where("chatKey", "==", chatKey)
      ));
      
      if (!chatDocsQuery.empty) {
        const chatDoc = chatDocsQuery.docs[0];
        return {
          id: chatDoc.id,
          ...chatDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error checking for existing admin chat:", error);
      return null;
    }
  };

  const getOrCreateAdminChat = async (adminUserId, adminName, eventId, eventName) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      
      const existingChat = await checkExistingAdminChat(adminUserId);
      
      if (existingChat) {
        return {
          chatId: existingChat.id,
          otherUserId: adminUserId,
          otherUserName: existingChat.participantInfo?.[adminUserId]?.name || adminName,
          eventName: eventName || existingChat.eventName || "Admin Chat"
        };
      }

      const chatKey = [currentUser.uid, adminUserId].sort().join('_');
      
      const newChat = {
        participants: [currentUser.uid, adminUserId],
        participantInfo: {
          [currentUser.uid]: {
            name: currentUser.displayName || "Organizer",
            photoURL: currentUser.photoURL || null
          },
          [adminUserId]: {
            name: adminName,
            photoURL: null
          }
        },
        eventId: eventId,
        eventName: eventName || "Admin Chat",
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        chatKey: chatKey
      };

      const newChatRef = doc(collection(db, "chats"));
      await setDoc(newChatRef, newChat);
      
      const messagesRef = collection(db, 'chats', newChatRef.id, 'messages');
      await addDoc(messagesRef, {
        text: eventId 
          ? `Hello! I need help with my event (${eventName}).` 
          : "Hello! I need some assistance.",
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "Organizer",
        createdAt: serverTimestamp()
      });
      
      await setDoc(newChatRef, {
        lastMessage: eventId 
          ? `Hello! I need help with my event (${eventName}).` 
          : "Hello! I need some assistance.",
        lastMessageAt: serverTimestamp()
      }, { merge: true });
      
      return {
        chatId: newChatRef.id,
        otherUserId: adminUserId,
        otherUserName: adminName,
        eventName: eventName || "Admin Chat"
      };
    } catch (error) {
      console.error("Error in getOrCreateAdminChat:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={40} color="#000" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderEvent = ({ item }) => (
    <TouchableOpacity 
      onPress={() => setSelectedEvent(item)}
      style={styles.eventCard}
    >
      <View style={styles.eventHeader}>
        <Ionicons name="calendar-outline" size={20} color="#000" />
        <Text style={styles.eventTitle}>{item.name || 'Untitled Event'}</Text>
      </View>
      {item.description && (
        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      {item.date && (
        <View style={styles.eventDateContainer}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.eventDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
      )}
      {item.location?.address && (
        <View style={styles.eventLocationContainer}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.eventLocation} numberOfLines={1}>
            {item.location.address}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (selectedEvent) {
    return (
      <SafeAreaView style={styles.detailContainer}>
        <TouchableOpacity 
          onPress={() => setSelectedEvent(null)} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Back to Events</Text>
        </TouchableOpacity>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailScrollContent}
        >
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>{selectedEvent.name || 'Event'}</Text>
            
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>DESCRIPTION</Text>
              <Text style={styles.sectionText}>
                {selectedEvent.description || 'No description provided'}
              </Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>DATE</Text>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.sectionText}>
                  {new Date(selectedEvent.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
            
            {selectedEvent.location?.address && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>LOCATION</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#666" style={styles.infoIcon} />
                  <Text style={styles.sectionText}>
                    {selectedEvent.location.address}
                  </Text>
                </View>
              </View>
            )}

            {selectedEvent.items_accepted?.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>ITEMS ACCEPTED</Text>
                <View style={styles.itemsContainer}>
                  {selectedEvent.items_accepted.map((item, index) => (
                    <View key={index} style={styles.itemTag}>
                      <Text style={styles.itemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleContactAdmin}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Contact Admin About This Event</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Ionicons name="person-circle-outline" size={80} color="#000" />
          </View>
          <Text style={styles.profileName}>{profile?.name || 'Organizer'}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#000" />
            <Text style={styles.sectionTitle}>Your Events</Text>
          </View>
          
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color="#999" />
              <Text style={styles.emptyText}>No events posted yet</Text>
            </View>
          ) : (
            <FlatList
              data={events}
              keyExtractor={(item) => item._id}
              renderItem={renderEvent}
              contentContainerStyle={styles.listContent}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
       <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleResetPassword}
        >
          <Ionicons name="key-outline" size={20} color="#000" />
          <Text style={styles.actionButtonText}>Reset Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleContactAdmin}
        >
          <Ionicons name="headset-outline" size={20} color="#000" />
          <Text style={styles.actionButtonText}>Contact Admin</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
              
        
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  detailScrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    color: '#000',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  profileImageContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 40,
    padding: 8,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 12,
    color: '#000',
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  eventDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  eventLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  contactAdminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#000',
    borderRadius: 8,
    marginBottom: 12,
  },
  contactAdminText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 8,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailContent: {
    paddingBottom: 100,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
    fontWeight: '500',
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  detailSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
    marginHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoIcon: {
    marginRight: 8,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  itemTag: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  itemText: {
    fontSize: 14,
    color: '#000',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#000',
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 8,
  },
});

export default OrganizerProfileScreen;