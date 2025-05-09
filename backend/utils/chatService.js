import { firestore } from '../firebaseConfig';
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

const chatCollection = collection(firestore, 'chats');
const messageCollection = collection(firestore, 'messages');

export const chatService = {
  // Get all chats for a specific user
  getUserChats: (userId, callback) => {
    const q = query(
      chatCollection,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const chats = [];
      querySnapshot.forEach((doc) => {
        chats.push({ id: doc.id, ...doc.data() });
      });
      callback(chats);
    });
  },

  // Get or create a chat between two users
  getOrCreateChat: async (currentUserId, otherUserId, currentUserRole, otherUserRole) => {
    // Check if chat already exists
    const q = query(
      chatCollection,
      where('participants', 'array-contains', currentUserId)
    );
    
    const querySnapshot = await getDocs(q);
    let existingChat = null;
    
    querySnapshot.forEach((doc) => {
      const chatData = doc.data();
      if (chatData.participants.includes(otherUserId)) {
        existingChat = { id: doc.id, ...chatData };
      }
    });
    
    if (existingChat) {
      return existingChat;
    }
    
    // Create new chat if none exists
    const newChat = {
      participants: [currentUserId, otherUserId],
      participantRoles: [currentUserRole, otherUserRole],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: {
        text: '',
        sentAt: serverTimestamp(),
        sentBy: ''
      },
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0
      }
    };
    
    const chatRef = await addDoc(chatCollection, newChat);
    return { id: chatRef.id, ...newChat };
  },

  // Get messages for a specific chat
  getChatMessages: (chatId, callback) => {
    const q = query(
      collection(firestore, `chats/${chatId}/messages`),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      callback(messages);
    });
  },

  // Send a new message
  sendMessage: async (chatId, senderId, text) => {
    const chatRef = doc(firestore, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      throw new Error('Chat does not exist');
    }
    
    const chatData = chatDoc.data();
    const otherUserId = chatData.participants.find(id => id !== senderId);
    
    // Add message to subcollection
    await addDoc(collection(firestore, `chats/${chatId}/messages`), {
      senderId,
      text,
      timestamp: serverTimestamp(),
      read: {
        [senderId]: true,
        [otherUserId]: false
      }
    });
    
    // Update chat document with last message and unread count
    const unreadCount = { ...chatData.unreadCount };
    unreadCount[otherUserId] = (unreadCount[otherUserId] || 0) + 1;
    
    await updateDoc(chatRef, {
      lastMessage: {
        text,
        sentAt: serverTimestamp(),
        sentBy: senderId
      },
      updatedAt: serverTimestamp(),
      unreadCount
    });
  },

  // Mark messages as read
  markMessagesAsRead: async (chatId, userId) => {
    const chatRef = doc(firestore, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      return;
    }
    
    const chatData = chatDoc.data();
    if (!chatData.participants.includes(userId)) {
      return;
    }
    
    // Update unread count
    const unreadCount = { ...chatData.unreadCount };
    unreadCount[userId] = 0;
    
    await updateDoc(chatRef, { unreadCount });
    
    // Mark all messages as read for this user
    const messagesQuery = query(collection(firestore, `chats/${chatId}/messages`));
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const batch = firestore.batch();
    
    messagesSnapshot.forEach((messageDoc) => {
      const messageData = messageDoc.data();
      const readStatus = messageData.read || {};
      
      if (!readStatus[userId]) {
        const messageRef = doc(firestore, `chats/${chatId}/messages`, messageDoc.id);
        batch.update(messageRef, {
          [`read.${userId}`]: true
        });
      }
    });
    
    await batch.commit();
  },

  // Get total unread message count for a user
  getTotalUnreadCount: async (userId) => {
    const q = query(
      chatCollection,
      where('participants', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    let totalUnread = 0;
    
    querySnapshot.forEach((doc) => {
      const chatData = doc.data();
      totalUnread += chatData.unreadCount[userId] || 0;
    });
    
    return totalUnread;
  }
};