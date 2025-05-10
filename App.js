import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserNavigator from './app/navigation/UserNavigator';
import AdminNavigator from './app/navigation/AdminNavigator';
import OrganizerNavigator from './app/navigation/OrganizerNavigator';
import AuthNavigator from './app/navigation/AuthNavigator';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { UserContextProvider } from './app/contexts/UserContext';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false); 
  const auth = getAuth();

  // Track user auth state and fetch role if needed
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoadingAuth(false);
      if (currentUser) {
        setUser(currentUser);
        setLoadingRole(true); // we’re about to fetch role

        try {
          const response = await fetch(`http://localhost:5000/api/auth/user-role/${currentUser.uid}`);
          const data = await response.json();
          setUserRole(data.role);
        } catch (err) {
          console.log('Error fetching user role:', err);
          setUserRole(null);
        } finally {
          setLoadingRole(false);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return unsubscribe;
  }, []);
   // If loading, show the spinner
  if (loadingAuth || (user && loadingRole)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <UserContextProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : userRole === 'admin' ? (
            <Stack.Screen name="Admin" component={AdminNavigator} />
          ) : userRole === 'organizer' ? (
            <Stack.Screen name="Organizer" component={OrganizerNavigator} />
          ) : (
            <Stack.Screen name="User" component={UserNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </UserContextProvider>
  );
}