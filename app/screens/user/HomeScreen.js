import React from 'react';
import { View, Text, Button } from 'react-native';
import { auth } from '../../firebaseConfig';

export default function HomeScreen({ route, navigation }) {
  const logout = async () => {
    await auth.signOut();
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Welcome!</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
