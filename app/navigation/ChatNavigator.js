// src/navigation/ChatNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatListScreen from "../screens/ChatListScreen";
import ChatScreen from "../screens/ChatScreen";

const Stack = createNativeStackNavigator();

const ChatNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ChatList" 
        component={ChatListScreen} 
        options={{ title: "Messages" }} 
      />
      <Stack.Screen 
        name="ChatScreen" 
        component={ChatScreen} 
        options={({ route }) => ({ 
          title: route.params?.eventName || "Chat",
          headerBackTitle: "Back"
        })} 
      />
    </Stack.Navigator>
  );
};

export default ChatNavigator;