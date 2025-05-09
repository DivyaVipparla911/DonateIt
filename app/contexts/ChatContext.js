import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useUser } from './UserContext';
import { 
  createChat, 
  sendMessage, 
  getChatMessages, 
  getUserChats 
} from '../hooks/useChat';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [currentChat, setCurrentChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const { currentUser } = useAuth();
  const { userData } = useUser();

  const startChat = async (otherUserId) => {
    try {
      const participants = [currentUser.uid, otherUserId].sort();
      const chatId = await createChat(participants);
      setCurrentChat(chatId);
      return chatId;
    } catch (error) {
      console.error('Error starting chat:', error);
      throw error;
    }
  };

  const loadChats = () => {
    if (!currentUser) return;
    return getUserChats(currentUser.uid, (userChats) => {
      setChats(userChats);
    });
  };

  const loadMessages = (chatId) => {
    return getChatMessages(chatId, (chatMessages) => {
      setMessages(chatMessages);
    });
  };

  useEffect(() => {
    if (currentUser) {
      const unsubscribe = loadChats();
      return () => unsubscribe && unsubscribe();
    }
  }, [currentUser]);

  return (
    <ChatContext.Provider
      value={{
        currentChat,
        chats,
        messages,
        startChat,
        sendMessage,
        loadMessages,
        setCurrentChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => useContext(ChatContext);