// import React, { useState } from 'react';
// import { View, TextInput, Button, Alert, Text, TouchableOpacity } from 'react-native';
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../firebaseConfig';
// import axios from 'axios';

// export default function SignInScreen({ navigation }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const handleSignin = async () => {
//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, email, password);
//       console.log('Firebase sign-in success:', userCredential);
//       const idToken = await userCredential.user.getIdToken();
//       console.log("idToken", idToken);

//       const res = await axios.post('http://localhost:5000/api/auth/signin', {
//         idToken,
//       });

//       const { role } = res.data;
//       Alert.alert('Welcome', `Logged in as ${role}`);
//       navigation.navigate('Home', { role });
//     } catch (err) {
//       console.log('Firebase sign-in error:', err.code, err.message);
//       Alert.alert('Sign In Failed', err.message);
//     }
//   };

//   return (
//     <View style={{ padding: 20 }}>
//       <TextInput placeholder="Email" onChangeText={setEmail} value={email} style={{ marginBottom: 10 }} />
//       <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} style={{ marginBottom: 10 }} />
//        <TouchableOpacity onPress={handleSignin}>
//        <Text>Sign In</Text>
//      </TouchableOpacity>

//      <View >
//               <Text >Don't have an account? </Text>
//               <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
//                 <Text>Create Account</Text>
//               </TouchableOpacity>
//             </View>
//     </View>
//   );
// }


import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text, TouchableOpacity } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import axios from 'axios';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase sign-in success:', userCredential);

      // Force refresh of the ID token to avoid expiration issues
      const idToken = await userCredential.user.getIdToken(true);
      console.log("idToken", idToken);

      // Sending ID token to backend to verify and get user role
      // const res = await axios.post('http://localhost:5000/api/auth/signin', { idToken });

      // const { role } = res.data;
      // Alert.alert('Welcome', `Logged in as ${role}`);
     // navigation.navigate('Home', { role });  // Navigate to Home screen with role
    } catch (err) {
      console.log('Firebase sign-in error:', err.code, err.message);
      
      // Handle specific errors
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
    <View style={{ padding: 20 }}>
      <TextInput 
        placeholder="Email" 
        onChangeText={setEmail} 
        value={email} 
        style={{ marginBottom: 10, padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 }} 
      />
      <TextInput 
        placeholder="Password" 
        secureTextEntry 
        onChangeText={setPassword} 
        value={password} 
        style={{ marginBottom: 10, padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 }} 
      />
      
      {/* Sign In button */}
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

      {/* Navigate to SignUp if no account */}
      <View style={{ marginTop: 20 }}>
        <Text>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={{ color: '#007bff' }}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
