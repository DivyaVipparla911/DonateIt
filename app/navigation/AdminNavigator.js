import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';
import ManageEventsScreen from '../screens/admin/ManageEventsScreen';  
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';  
import ManageRequestsScreen from '../screens/admin/ManageRequestsScreen';  
import ManageDonationsScreen from '../screens/admin/ManageDonationsScreen';  
const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'ManageEvents') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'ManageDonations') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'ManageRequests') {
              iconName = focused ? 'people' : 'people-outline';
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
        <Tab.Screen name="ManageRequests" component={ManageRequestsScreen} />
        <Tab.Screen name="AdminProfile" component={AdminProfileScreen} />
        <Tab.Screen name="ManageDonations" component={ManageDonationsScreen} />
      </Tab.Navigator>
  );
};

export default AdminTabNavigator;
