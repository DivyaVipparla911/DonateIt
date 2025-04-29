import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/user/UserHomeScreen";
import ProfileScreen from "../screens/user/UserProfileScreen";
import AddDonationScreen from "../screens/user/AddDonationScreen";
import ChatScreen from "../screens/ChatScreen";
import BoxFinderScreen from "../screens/user/BoxFinderScreen";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Search") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "Add") {
            iconName = focused ? "add-circle" : "add-circle-outline";
          } else if (route.name === "Chat") {
            iconName = focused ? "chatbubble" : "chatbubble-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "gray",
        tabBarShowLabel: false,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={BoxFinderScreen} />
      <Tab.Screen name="Add" component={AddDonationScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;