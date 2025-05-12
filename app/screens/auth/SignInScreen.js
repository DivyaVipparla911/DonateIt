import React, { useState } from 'react';
import { View, TextInput, Alert, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; 
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase sign-in success:', userCredential);

      const idToken = await userCredential.user.getIdToken(true);
      console.log("idToken", idToken);
    } catch (err) {
      console.log('Firebase sign-in error:', err.code, err.message);

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
    <View style={styles.container}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Icon name="hand-heart" size={50} color="#000" style={styles.logoIcon} />
        <Text style={styles.appName}>DonateIt</Text>
      </View>

      {/* Email Input */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={20} color="#555" style={styles.inputIcon} />
          <TextInput 
            placeholder="Enter your email"
            placeholderTextColor="#999"
            onChangeText={setEmail} 
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input} 
          />
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputContainer}>
          <Icon name="lock-outline" size={20} color="#555" style={styles.inputIcon} />
          <TextInput 
            placeholder="Enter your password"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            onChangeText={setPassword} 
            value={password}
            style={styles.input} 
          />
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            <Icon 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#555" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity
        style={styles.signInButton}
        onPress={handleSignin}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      {/* Forgot Password Link */}
      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={() => navigation.navigate("ForgotPassword")}
      >
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Sign Up Link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
          <Text style={[styles.linkText, styles.createAccountText]}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    marginBottom: 15,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#000',
    fontSize: 16,
  },
  passwordToggle: {
    padding: 10,
  },
  signInButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#555',
    fontSize: 14,
  },
  linkText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  createAccountText: {
    textDecorationLine: 'underline',
  },
});