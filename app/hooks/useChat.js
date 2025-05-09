// src/hooks/useChat.js
import { useEffect, useState, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

const useChat = (chatRoomId, currentUser) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatRoomId, 'messages'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      setMessages(
        snapshot.docs.map(doc => ({
          _id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }))
      );
    });

    return unsubscribe;
  }, [chatRoomId]);

  const sendMessage = useCallback(async (newMessages = []) => {
    const message = newMessages[0];
    await addDoc(collection(db, 'chats', chatRoomId, 'messages'), message);
  }, [chatRoomId]);

  return { messages, sendMessage };
};

export default useChat;