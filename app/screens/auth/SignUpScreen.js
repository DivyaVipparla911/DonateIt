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
import { createUserWithEmailAndPassword } from 'firebase/auth';
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

      // Send data to backend
      await axios.post('http://localhost:5000/api/auth/signup', {
        token,
        name,
        dateOfBirth,
      });

      // Save to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name,
        dateOfBirth: dateOfBirth.toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Account created successfully.');
      await signOut(auth); 
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

  const renderDateInput = () => {
    const formattedDate = dateOfBirth.toISOString().split('T')[0];

    if (Platform.OS === 'web') {
      return (
        <View style={{ marginBottom: 15 }}>
          <Text style={{ marginBottom: 5 }}>Date of Birth</Text>
          <input
            type="date"
            value={formattedDate}
            onChange={(e) => setDateOfBirth(new Date(e.target.value))}
            style={{
              padding: 10,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
              width: '100%',
            }}
          />
        </View>
      );
    }

    return (
      <View style={{ marginBottom: 15 }}>
        <TouchableOpacity onPress={() => setShowPicker(true)}>
          <Text style={{ marginBottom: 5 }}>
            Date of Birth: {dateOfBirth.toDateString()}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <>
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowPicker(false);
                }
                if (selectedDate) {
                  setDateOfBirth(selectedDate);
                }
              }}
              maximumDate={new Date()}
            />
            {Platform.OS === 'ios' && (
              <Button title="Done" onPress={() => setShowPicker(false)} />
            )}
          </>
        )}
      </View>
    );
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
        {renderDateInput()}
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
