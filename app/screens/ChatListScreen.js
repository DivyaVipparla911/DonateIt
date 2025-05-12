import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
  RefreshControl,
  Alert,
  TextInput
} from "react-native";
import { collection, query, where, onSnapshot, getDocs, doc, setDoc } from "firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { db, auth } from "../firebaseConfig";
import { useUserContext } from "../contexts/UserContext";
import { Ionicons } from '@expo/vector-icons';

const ChatListScreen = ({ route }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usersData, setUsersData] = useState({});
  const { user } = useUserContext();
  const navigation = useNavigation();

  // Function to get unique chat key for deduplication
  const getChatKey = (participants) => {
    return participants.sort().join('_');
  };

  // Fetch all users data
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const users = {};
      snapshot.forEach(doc => {
        users[doc.id] = doc.data();
      });
      setUsersData(users);
    });

    return () => unsubscribeUsers();
  }, []);

  // Check for existing chat between current user and other user
  const checkExistingChat = async (otherUserId) => {
    try {
      const chatsRef = collection(db, "chats");
      const q = query(
        chatsRef,
        where("participants", "array-contains", user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        if (data.participants.includes(otherUserId)) {
          return {
            id: doc.id,
            ...data,
            participants: data.participants
          };
        }
      }
      return null;
    } catch (error) {
      console.error("Error checking for existing chat:", error);
      return null;
    }
  };

  // Create or get existing chat
  const getOrCreateChat = async (otherUserId, otherUserName, eventId, eventName) => {
    try {
      // Check for existing chat first
      const existingChat = await checkExistingChat(otherUserId);
      
      if (existingChat) {
        return {
          chatId: existingChat.id,
          otherUserId,
          otherUserName: usersData[otherUserId]?.name || otherUserName, // Use fresh user data
          eventName: existingChat.eventName || eventName
        };
      }

      // Create new chat if none exists
      const newChat = {
        participants: [user.uid, otherUserId],
        participantInfo: {
          [user.uid]: {
            name: user.displayName || "You",
            photoURL: user.photoURL || null
          },
          [otherUserId]: {
            name: usersData[otherUserId]?.name || otherUserName, // Use fresh user data
            photoURL: usersData[otherUserId]?.photoURL || null
          }
        },
        eventId,
        eventName,
        lastMessage: "",
        lastMessageAt: new Date(),
        createdAt: new Date(),
        chatKey: getChatKey([user.uid, otherUserId])
      };

      const newChatRef = doc(collection(db, "chats"));
      await setDoc(newChatRef, newChat);
      
      return {
        chatId: newChatRef.id,
        otherUserId,
        otherUserName: usersData[otherUserId]?.name || otherUserName, // Use fresh user data
        eventName
      };
    } catch (error) {
      console.error("Error in getOrCreateChat:", error);
      throw error;
    }
  };

  // Fetch chats with deduplication
  const fetchChats = useCallback(() => {
    let unsubscribe = () => {};

    try {
      if (!user?.uid) {
        setLoading(false);
        setError("User not authenticated");
        return unsubscribe;
      }

      setLoading(true);
      setError(null);

      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid)
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const chatMap = new Map();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const participants = data.participants || [];
          const otherUserId = participants.find(id => id !== user.uid);
          const chatKey = data.chatKey || getChatKey(participants);

          const existingChat = chatMap.get(chatKey);
          const currentLastMessageAt = data.lastMessageAt?.toDate() || new Date(0);

          if (!existingChat || currentLastMessageAt > existingChat.lastMessageAt) {
            chatMap.set(chatKey, {
              id: doc.id,
              lastMessage: data.lastMessage || "No messages yet",
              lastMessageAt: currentLastMessageAt,
              otherUserId,
              otherUserName: usersData[otherUserId]?.name || // Use fresh user data
                            data.participantInfo?.[otherUserId]?.name ||
                            (user.role === "organizer" ? "Attendee" : "Organizer"),
              otherUserPhoto: usersData[otherUserId]?.photoURL || // Use fresh user data
                            data.participantInfo?.[otherUserId]?.photoURL ||
                            null,
              eventName: data.eventName || "Unknown Event",
              participants,
              chatKey
            });
          }
        });

        const uniqueChats = Array.from(chatMap.values()).sort(
          (a, b) => b.lastMessageAt - a.lastMessageAt
        );

        setChats(uniqueChats);
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error("Firestore error:", error);
        setError("Failed to load chats");
        setLoading(false);
        setRefreshing(false);
      });

    } catch (error) {
      console.error("Error setting up listener:", error);
      setError("Failed to initialize chat service");
      setLoading(false);
      setRefreshing(false);
    }

    return unsubscribe;
  }, [user, usersData]); // Add usersData to dependencies

  // Fetch on focus and initial load
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = fetchChats();
      return () => unsubscribe();
    }, [fetchChats])
  );

  const handleOpenChat = (chat) => {
    if (!user?.uid || !chat?.id) {
      Alert.alert("Error", "Cannot open chat at this time");
      return;
    }

    navigation.navigate('ChatScreen', {
      chatId: chat.id,
      otherUserId: chat.otherUserId,
      otherUserName: usersData[chat.otherUserId]?.name || chat.otherUserName, // Use fresh user data
      eventName: chat.eventName,
      isOrganizer: user.role === "organizer"
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      chat.otherUserName.toLowerCase().includes(query) ||
      chat.eventName.toLowerCase().includes(query) ||
      chat.lastMessage.toLowerCase().includes(query)
    );
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading your chats...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="warning" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setLoading(true);
            fetchChats();
          }}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        {/* <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NewChat')}>
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity> */}
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.chatItem}
            onPress={() => handleOpenChat(item)}
          >
            {item.otherUserPhoto ? (
              <Image source={{ uri: item.otherUserPhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.otherUserName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            <View style={styles.chatContent}>
              <Text style={styles.chatName}>{item.otherUserName}</Text>
              <Text style={styles.eventName}>{item.eventName}</Text>
              <Text style={styles.lastMessage}>{item.lastMessage}</Text>
            </View>
            
            <Text style={styles.time}>
              {item.lastMessageAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No conversations found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? "Try a different search" : "Start a new chat to get started"}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: "#8E8E93",
  },
  errorText: {
    fontSize: 18,
    color: "#FF3B30",
    marginVertical: 16,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C6C6C8",
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: "#000",
    paddingVertical: 0,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C6C6C8",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E1E1E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "500",
    color: "#8E8E93",
  },
  chatContent: {
    flex: 1,
  },
  chatName: {
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 2,
  },
  eventName: {
    fontSize: 15,
    color: "#8E8E93",
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 16,
    color: "#00000099",
  },
  time: {
    fontSize: 15,
    color: "#8E8E93",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#8E8E93",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#8E8E93",
    marginTop: 8,
    textAlign: "center",
  },
});

export default ChatListScreen;