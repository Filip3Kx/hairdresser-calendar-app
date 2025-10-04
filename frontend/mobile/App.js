import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The backend is running in another container. From the Android emulator's perspective,
// the host machine (which exposes the backend port) is accessible at 10.0.2.2.
const API_HOST = 'http://calendar_app_backend:5000';

const App = () => {
  const [apiKey, setApiKey] = useState(null);
  const [view, setView] = useState('login'); // 'login' or 'register'

  // Form state
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Check for a stored API key when the app starts
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedApiKey = await AsyncStorage.getItem('apiKey');
        if (storedApiKey) {
          setApiKey(storedApiKey);
        }
      } catch (error) {
        console.error('Failed to load API key from storage', error);
      }
    };
    checkLoginStatus();
  }, []);

  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_HOST}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, surname, email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }
      Alert.alert('Success', 'Registration successful! Please log in.');
      setView('login'); // Switch to login view after successful registration
    } catch (error) {
      Alert.alert('Registration Error', error.message);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_HOST}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      const data = await response.json();
      await AsyncStorage.setItem('apiKey', data.api_key);
      setApiKey(data.api_key);
    } catch (error) {
      Alert.alert('Login Error', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('apiKey');
      setApiKey(null);
      // Clear input fields
      setEmail('');
      setPassword('');
      setName('');
      setSurname('');
    } catch (error) {
      Alert.alert('Logout Error', 'Failed to log out.');
    }
  };

  // If user is logged in, show a welcome message
  if (apiKey) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome!</Text>
        <Text>You are logged in.</Text>
        <View style={styles.buttonContainer}>
          <Button title="Logout" onPress={handleLogout} color="#ff6347" />
        </View>
      </View>
    );
  }

  // If not logged in, show Login or Register form
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{view === 'login' ? 'Login' : 'Register'}</Text>

      {view === 'register' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Surname"
            value={surname}
            onChangeText={setSurname}
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <View style={styles.buttonContainer}>
        {view === 'login' ? (
          <Button title="Login" onPress={handleLogin} />
        ) : (
          <Button title="Register" onPress={handleRegister} />
        )}
      </View>

      <Button
        title={view === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
        onPress={() => setView(view === 'login' ? 'register' : 'login')}
        color="#888"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 12,
    paddingLeft: 10,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    marginVertical: 10,
  },
});

export default App;