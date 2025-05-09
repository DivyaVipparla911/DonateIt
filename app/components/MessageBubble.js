// src/components/MessageBubble.js
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import moment from "moment";

const MessageBubble = ({ text, isCurrentUser, timestamp, userPhoto, status }) => {
  return (
    <View style={[styles.row, isCurrentUser ? styles.rightRow : styles.leftRow]}>
      {!isCurrentUser && userPhoto && (
        <Image source={{ uri: userPhoto }} style={styles.avatar} />
      )}
      <View style={[styles.bubble, isCurrentUser ? styles.rightBubble : styles.leftBubble]}>
        <Text style={styles.text}>{text}</Text>
        <View style={styles.footer}>
          <Text style={styles.time}>{moment(timestamp?.toDate()).format("h:mm A")}</Text>
          {isCurrentUser && status && (
            <Text style={styles.status}>{status === "read" ? "✓✓" : "✓"}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default MessageBubble;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginVertical: 5,
    alignItems: "flex-end",
    paddingHorizontal: 10,
  },
  leftRow: {
    justifyContent: "flex-start",
  },
  rightRow: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 6,
  },
  bubble: {
    padding: 10,
    borderRadius: 15,
    maxWidth: "75%",
  },
  leftBubble: {
    backgroundColor: "#eee",
  },
  rightBubble: {
    backgroundColor: "#007aff",
  },
  text: {
    color: "#fff",
    fontSize: 16,
  },
  time: {
    color: "#ddd",
    fontSize: 10,
    marginTop: 4,
    marginRight: 6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  status: {
    fontSize: 10,
    color: "#ddd",
  },
});