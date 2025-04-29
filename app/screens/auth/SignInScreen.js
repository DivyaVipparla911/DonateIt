import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Make sure this path is correct

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase sign-in success:', userCredential);

      // Get ID token
      const idToken = await userCredential.user.getIdToken(true);
      console.log("idToken", idToken);
    } catch (err) {
      console.log('Firebase sign-in error:', err.code, err.message);
      
      // Handle different errors
      if (err.code === 'auth/wrong-password') {
        Alert.alert('Sign In Failed', 'Incorrect password');
      } else if (err.code === 'auth/user-not-found') {
        Alert.alert('Sign In Failed', 'No user found with this email');
      } else {
        Alert.alert('Sign In Failed', 'An error occurred. Please try again later');
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f4f4f4' }}>
      <TextInput 
        placeholder="Email" 
        onChangeText={setEmail} 
        value={email} 
        style={{
          marginBottom: 10, 
          padding: 8, 
          borderWidth: 1, 
          borderColor: '#ccc', 
          borderRadius: 5, 
          paddingTop: 10,
        }} 
      />
      <TextInput 
        placeholder="Password" 
        secureTextEntry 
        onChangeText={setPassword} 
        value={password} 
        style={{
          marginBottom: 10, 
          padding: 8, 
          borderWidth: 1, 
          borderColor: '#ccc', 
          borderRadius: 5, 
          paddingTop: 10,
        }} 
      />

      <TouchableOpacity
        style={{
          backgroundColor: '#007bff', 
          padding: 10, 
          borderRadius: 5, 
          alignItems: 'center', 
          marginTop: 10,
        }}
        onPress={handleSignin}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>Sign In</Text>
      </TouchableOpacity>

      <View style={{ marginTop: 20 }}>
        <Text>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={{ color: '#007bff' }}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
