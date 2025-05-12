import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';
import ManageEventsScreen from '../screens/admin/ManageEventsScreen';  
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';  
import ManageDonationBoxesScreen from '../screens/admin/ManageDonationBoxesScreen';  
import ManageDonationsScreen from '../screens/admin/ManageDonationsScreen';  
import ChatNavigator from "./ChatNavigator";
const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
           let iconName;
            if (route.name === 'ManageEvents') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'ManageDonations') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === "ManageBoxes") {
            iconName = focused ? "cube" : "cube-outline";
            }  else if (route.name === "Chat") {
            iconName = focused ? "chatbubble" : "chatbubble-outline";
            } else if (route.name === 'AdminProfile') {
              iconName = focused ? 'person' : 'person-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'black',
          tabBarInactiveTintColor: 'gray',
          tabBarShowLabel: false,
          headerShown: false,
        })}
      >
        <Tab.Screen name="ManageEvents" component={ManageEventsScreen} />
        <Tab.Screen name="ManageBoxes" component={ManageDonationBoxesScreen} />
        <Tab.Screen name="ManageDonations" component={ManageDonationsScreen} />
        <Tab.Screen name="Chat" component={ChatNavigator} />       
        <Tab.Screen name="AdminProfile" component={AdminProfileScreen} />

      </Tab.Navigator>
  );
};

export default AdminTabNavigator;
