import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserNavigator from './app/navigation/UserNavigator';
import AdminNavigator from './app/navigation/AdminNavigator';
import OrganizerNavigator from './app/navigation/OrganizerNavigator';
import AuthNavigator from './app/navigation/AuthNavigator';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { UserContextProvider } from './app/contexts/UserContext'; // ✅ Import the context provider

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoadingAuth(false);

      if (currentUser) {
        setUser(currentUser);
        setLoadingRole(true);

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

  // Show a spinner while loading auth or role
  if (loadingAuth || (user && loadingRole)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // ✅ Wrap navigators with UserContextProvider
  return (
    <UserContextProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <Stack.Screen name="Auth" component={AuthNavigator} initialParams={{ screen: 'SignIn' }} />
          ) : userRole === 'admin' ? (
            <Stack.Screen name="AdminNav" component={AdminNavigator} />
          ) : userRole === 'organizer' ? (
            <Stack.Screen name="OrganizerNav" component={OrganizerNavigator} />
          ) : (
            <Stack.Screen name="UserNav" component={UserNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </UserContextProvider>
  );
}