import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
  

  // Fetch user role from server
  // const fetchUserRole = async (userId) => {
  //   try {
  //     const response = await fetch(`http://localhost:5000/api/auth/user-role/${userId}`);
  //     if (!response.ok) {
  //       throw new Error(`Failed to fetch user role: ${response.statusText}`);
  //     }
  //     const data = await response.json();
  //     setUserRole(data.role);  // Set role once it's fetched
  //   } catch (err) {
  //     console.log('Error fetching user role:', err);
  //     alert('Error fetching user role. Please try again later.');
  //   } finally {
  //     setLoading(false); // Set loading state to false once role fetching is done
  //   }
  // };

  // If loading, show the spinner
  if (loadingAuth || (user && loadingRole)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Determine which navigator to show based on user role
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // If no user, show the AuthNavigator
          <Stack.Screen name="Auth" component={AuthNavigator} initialParams={{ screen: 'SignIn' }} />
        ) : userRole === 'admin' ? (
          // If user role is admin, show AdminNavigator
          <Stack.Screen name="AdminNav" component={AdminNavigator} />
        ) : userRole === 'organizer' ? (
          // If user role is organizer, show OrganizerNavigator
          <Stack.Screen name="OrganizerNav" component={OrganizerNavigator} />
        ) : (
          // If user role is 'user', show UserNavigator
          <Stack.Screen name="UserNav" component={UserNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
