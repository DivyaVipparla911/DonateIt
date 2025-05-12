import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  StyleSheet,
  Platform
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import axios from 'axios';
import { collection, query, where, getDocs, doc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from "firebase/auth";


export default function UserProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await auth.signOut();
  };

  const navigateToChat = (chatParams) => {
    navigation.navigate('Chats');
    setTimeout(() => {
      navigation.navigate('Chats', { 
        screen: 'ChatScreen',
        params: chatParams
      });
    }, 100);
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

  const handleContactAdmin = async () => {
    try {
      const adminUserId = "VlNgmUErG7QjqCC5hhLkPoyDb0P2";
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "You must be logged in to contact admin");
        return;
      }

      const chatData = await getOrCreateAdminChat(
        adminUserId, 
        "Admin", 
        selectedDonation ? selectedDonation._id : null,
        selectedDonation ? `Donation: ${selectedDonation.category || 'Untitled'}` : "General Inquiry"
      );

      const chatParams = {
        chatId: chatData.chatId,
        otherUserId: adminUserId,
        otherUserName: "Admin",
        eventName: chatData.eventName
      };
      
      navigateToChat(chatParams);
      
    } catch (error) {
      console.error("Error contacting admin:", error);
      Alert.alert("Error", "Failed to open chat with admin. Please try again later.");
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

  const getOrCreateAdminChat = async (adminUserId, adminName, donationId, donationName) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("User not authenticated");
      
      const existingChat = await checkExistingAdminChat(adminUserId);
      
      if (existingChat) {
        return {
          chatId: existingChat.id,
          otherUserId: adminUserId,
          otherUserName: existingChat.participantInfo?.[adminUserId]?.name || adminName,
          eventName: donationName || existingChat.eventName || "Admin Chat"
        };
      }

      const chatKey = [currentUser.uid, adminUserId].sort().join('_');
      
      const newChat = {
        participants: [currentUser.uid, adminUserId],
        participantInfo: {
          [currentUser.uid]: {
            name: currentUser.displayName || "User",
            photoURL: currentUser.photoURL || null
          },
          [adminUserId]: {
            name: adminName,
            photoURL: null
          }
        },
        donationId: donationId,
        eventName: donationName || "Admin Chat",
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        chatKey: chatKey
      };

      const newChatRef = doc(collection(db, "chats"));
      await setDoc(newChatRef, newChat);
      
      const messagesRef = collection(db, 'chats', newChatRef.id, 'messages');
      await addDoc(messagesRef, {
        text: donationId 
          ? `Hello! I need help with my donation (${donationName}).` 
          : "Hello! I need some assistance.",
        senderId: currentUser.uid,
        senderName: currentUser.displayName || "User",
        createdAt: serverTimestamp()
      });
      
      await setDoc(newChatRef, {
        lastMessage: donationId 
          ? `Hello! I need help with my donation (${donationName}).` 
          : "Hello! I need some assistance.",
        lastMessageAt: serverTimestamp()
      }, { merge: true });
      
      return {
        chatId: newChatRef.id,
        otherUserId: adminUserId,
        otherUserName: adminName,
        eventName: donationName || "Admin Chat"
      };
    } catch (error) {
      console.error("Error in getOrCreateAdminChat:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchProfileAndDonations = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;
        const token = await currentUser.getIdToken();

        const profileRes = await axios.get('http://localhost:5000/api/user/user-details', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(profileRes.data);

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
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndDonations();
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
            fetchProfileAndDonations();
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderDonation = ({ item }) => (
    <TouchableOpacity 
      onPress={() => setSelectedDonation(item)}
      style={styles.donationCard}
    >
      <View style={styles.donationHeader}>
        <Ionicons name="gift" size={20} color="#000" />
        <Text style={styles.donationTitle}>{item.category || 'Untitled'}</Text>
      </View>
      {item.donationDescription && (
        <Text style={styles.donationDescription} numberOfLines={2}>
          {item.donationDescription}
        </Text>
      )}
      {item.availability && (
        <View style={styles.donationDateContainer}>
          <Ionicons name="time" size={14} color="#666" />
          <Text style={styles.donationDate}>{item.availability}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (selectedDonation) {
    return (
      <SafeAreaView style={styles.detailContainer}>
        <TouchableOpacity 
          onPress={() => setSelectedDonation(null)} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Back to Donations</Text>
        </TouchableOpacity>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailScrollContent}
        >
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>{selectedDonation.category || 'Donation'}</Text>
            
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>DESCRIPTION</Text>
              <Text style={styles.sectionText}>
                {selectedDonation.description || 'No description provided'}
              </Text>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>AVAILABILITY</Text>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.sectionText}>
                  {selectedDonation.availability || 'Not specified'}
                </Text>
              </View>
            </View>

             <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>PICKUP TIME</Text>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.sectionText}>
                  {selectedDonation.dateTime || 'Not specified'}
                </Text>
              </View>
            </View>

              <View style={styles.detailSection}>
              <Text style={styles.sectionLabel}>ASSIGNEE</Text>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#666" style={styles.infoIcon} />
                <Text style={styles.sectionText}>
                  {selectedDonation.assignee || 'Not specified'}
                </Text>
              </View>
            </View>
            
            
            {selectedDonation.address?.address && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>LOCATION</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#666" style={styles.infoIcon} />
                  <Text style={styles.sectionText}>
                    {selectedDonation.address.address}
                  </Text>
                </View>
              </View>
            )}

            {selectedDonation.images?.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionLabel}>PHOTOS</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosContainer}
                >
                  {selectedDonation.images.map((photoUrl, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: photoUrl }}
                      style={styles.donationImage}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleContactAdmin}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Contact Admin About This Donation</Text>
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
          <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={20} color="#000" />
            <Text style={styles.sectionTitle}>Your Donations</Text>
          </View>
          
          {donations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="archive-outline" size={40} color="#999" />
              <Text style={styles.emptyText}>No donations posted yet</Text>
            </View>
          ) : (
            <FlatList
              data={donations}
              keyExtractor={(item) => item._id}
              renderItem={renderDonation}
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
}

const styles = StyleSheet.create({
  // Base container styles
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
  // Loading and error states
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
  
  // Profile header
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
  
  // Main content sections
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
  
  // Donation cards
  donationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  donationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  donationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  donationDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  donationDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  donationDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 8,
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  
  // Footer buttons
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
  
  // Detail view styles
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
  photosContainer: {
    paddingVertical: 8,
  },
  donationImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
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