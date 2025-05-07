import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !name.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();
    
      // Send user info to backend
      await axios.post('http://localhost:5000/api/auth/signup', {
        token,
        name,
      });
    
      // Save to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name,
        createdAt: new Date().toISOString(),
      });
    
      Alert.alert('Success', 'Account created. Please sign in.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });
      
    
    } catch (err) {
      console.error('Signup error:', err);
      Alert.alert('Error', err.message || 'Signup failed');    
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 50 }}>
        <TextInput
          placeholder="Email"
          onChangeText={setEmail}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          style={{
            marginBottom: 15,
            borderBottomWidth: 1,
            paddingVertical: 10,
          }}
        />
        <TextInput
          placeholder="Full Name"
          onChangeText={setName}
          value={name}
          style={{
            marginBottom: 15,
            borderBottomWidth: 1,
            paddingVertical: 10,
          }}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
          style={{
            marginBottom: 15,
            borderBottomWidth: 1,
            paddingVertical: 10,
          }}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <Button title="Sign Up" onPress={handleSignup} />
        )}

        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={{ color: '#007bff', marginTop: 15, textAlign: 'center' }}>
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
