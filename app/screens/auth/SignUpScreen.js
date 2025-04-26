import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  Text,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth } from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';


export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [address, setAddress] = useState('');
  //const [address, setAddress] = useState({ address: '', lat: null, lng: null });
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      await axios.post('http://localhost:5000/api/auth/signup', {
        token,
        name,
        dateOfBirth,
        address,
      });

      Alert.alert('Success', 'Account created');
      navigation.navigate('SignIn');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const renderDateInput = () => {
    const formattedDate = dateOfBirth.toISOString().split('T')[0];

    if (Platform.OS === 'web') {
      return (
        <View style={{ marginBottom: 10 }}>
          <Text>Date of Birth</Text>
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
      <View style={{ marginBottom: 10 }}>
        <TouchableOpacity onPress={() => setShowPicker(true)}>
          <Text>Select Date of Birth: {dateOfBirth.toDateString()}</Text>
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

  const handlePlaceSelect = (ref, setState) => (data, details = null) => {
    const address = data.description;
    const lat = details?.geometry?.location?.lat || null;
    const lng = details?.geometry?.location?.lng || null;
    setState({ address, lat, lng });
    ref.current?.setAddressText(address);
    ref.current?.blur();
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />
      <TextInput
        placeholder="Full Name"
        onChangeText={setName}
        value={name}
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />

      {renderDateInput()}

      <TextInput
        placeholder="Address"
        onChangeText={setAddress}
        value={address}
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />

      <Button title="Sign Up" onPress={handleSignup} />
      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={{ color: '#007bff', marginTop: 10 }}>Sign in</Text>
      </TouchableOpacity>
    </View>
  );
}
