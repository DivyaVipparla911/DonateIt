import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserNavigator from './app/navigation/UserNavigator';
import AdminNavigator from './app/navigation/AdminNavigator';
import OrganizerNavigator from './app/navigation/OrganizerNavigator';
import AuthNavigator from './app/navigation/AuthNavigator';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserRole(currentUser.uid);
      } else {
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/getUserRole/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user role: ${response.statusText}`);
      }
      const data = await response.json();
      setUserRole(data.role);  // Set role to state
    } catch (err) {
      console.log('Error fetching user role:', err);
      alert('Error fetching user role. Please try again later.');
    } finally {
      setLoading(false);  // Finished loading user role
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : userRole === 'admin' ? (
          <Stack.Screen name="AdminNav" component={AdminNavigator} />
        ) : userRole === 'organizer' ?(
          <Stack.Screen name="OrganizerNav" component={OrganizerNavigator} />
        ) : (
          <Stack.Screen name="UserNav" component={UserNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
