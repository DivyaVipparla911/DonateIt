import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChatListItem = ({ chat = {}, currentUserId }) => {
  // First check if chat is a valid object
  if (!chat || typeof chat !== 'object') {
    return null;
  }

  // Ensure we have valid data before rendering
  const {
    id,
    otherUserName = 'Unknown User',
    lastMessage = 'No messages yet',
    participants = []
  } = chat;

  // Don't render if we don't have basic chat data
  if (!id || !Array.isArray(participants)) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{otherUserName}</Text>
      <Text style={styles.message}>{typeof lastMessage === 'string' ? lastMessage : 'No messages yet'}</Text>
      {/* Add any other chat details you want to display */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  message: {
    color: '#666',
    marginTop: 5,
  },
});

export default ChatListItem;