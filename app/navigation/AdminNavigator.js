import React from 'react';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import AdminHomeScreen from '../screens/AdminHomeScreen';  // Create an Admin Home screen
import AdminProfileScreen from '../screens/AdminProfileScreen';  // Admin Profile screen
import ManageUsersScreen from '../screens/ManageUsersScreen';  // Admin screen to manage users

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'AdminHome') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'ManageUsers') {
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
        <Tab.Screen name="AdminHome" component={AdminHomeScreen} />
        <Tab.Screen name="ManageUsers" component={ManageUsersScreen} />
        <Tab.Screen name="AdminProfile" component={AdminProfileScreen} />
      </Tab.Navigator>
  );
};

export default AdminTabNavigator;
