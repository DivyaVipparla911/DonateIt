import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  StyleSheet,
  Alert
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';

const ChatScreen = ({ route, navigation }) => {
  const { chatId, otherUserId, eventName } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [usersData, setUsersData] = useState({});
  const flatListRef = useRef(null);

  // Fetch messages and user data
  useEffect(() => {
    // 1. Fetch messages for this chat
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribeMessages = onSnapshot(messagesQuery, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
      
      // Scroll to bottom after short delay
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    // 2. Fetch all users data - specifically looking for 'name' field
    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const users = {};
      snapshot.forEach(doc => {
        users[doc.id] = doc.data(); // Store all user data
      });
      setUsersData(users);
    });

    return () => {
      unsubscribeMessages();
      unsubscribeUsers();
    };
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !auth.currentUser) return;
  
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
  
      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        lastMessage: newMessage,
        lastMessageAt: serverTimestamp()
      }, { merge: true });
  
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.senderId === auth.currentUser?.uid;
    const senderData = usersData[item.senderId] || {};
    const displayName = senderData.name || 'Unknown';
    const messageTime = item.createdAt?.toDate 
      ? item.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '...';

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && (
          <Text style={styles.senderName}>{displayName}</Text>
        )}
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.messageTime}>{messageTime}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{eventName}</Text>
          <Text style={styles.headerSubtitle}>
            Chat with {usersData[otherUserId]?.name || 'User'}
          </Text>
        </View>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          placeholderTextColor="#999"
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            { opacity: pressed ? 0.7 : 1 },
            !newMessage.trim() && styles.disabledButton
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 0,
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECECEC',
    borderBottomLeftRadius: 0,
  },
  senderName: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 14,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  messageTime: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ChatScreen;