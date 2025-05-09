import React, { useState } from 'react';
import axios from 'axios';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignin = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // ✅ Get ID token and UID
      const idToken = await user.getIdToken(true);
      const uid = user.uid;
  
      // ✅ Call backend to get user role
      const response = await axios.get(`http://localhost:5000/api/auth/user-role/${uid}`);
      const role = response.data.role;
      console.log("Fetched user role:", role);
  
      // ✅ Navigate based on role
      if (role === 'admin') {
        navigation.reset({ index: 0, routes: [{ name: 'AdminHome' }] });
      } else if (role === 'organizer') {
        navigation.reset({ index: 0, routes: [{ name: 'OrganizerHome' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'UserHome' }] });
      }
  
    } catch (err) {
      console.error('Sign-in error:', err?.code || err?.message || err);
  
      if (err.response?.status === 404) {
        Alert.alert('Sign In Failed', 'User not found in database.');
      } else if (err.code === 'auth/wrong-password') {
        Alert.alert('Sign In Failed', 'Incorrect password');
      } else if (err.code === 'auth/user-not-found') {
        Alert.alert('Sign In Failed', 'No account found for this email');
      } else {
        Alert.alert('Sign In Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Text style={styles.title}>Sign In</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 32,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 48,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2, // for Android
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  button: {
    height: 48,
    backgroundColor: '#2b7de9',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#2b7de9',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
});