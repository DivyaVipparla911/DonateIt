import React, { useState } from 'react';
import { View, TextInput, Button, Alert, TouchableOpacity, Text } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import axios from 'axios';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log(userCredential);
      const token = await userCredential.user.getIdToken();
      console.log(token);

      // Send to backend
      await axios.post('http://localhost:5000/api/auth/signup', {
        email,
        password,
      });

      Alert.alert('Success', 'Account created');
      navigation.navigate('SignIn');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Email" onChangeText={setEmail} value={email} style={{ marginBottom: 10 }} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} style={{ marginBottom: 10 }} />
      <Button title="Sign Up" onPress={handleSignup} />
      <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
                <Text style={{ color: '#007bff' }}>Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}
