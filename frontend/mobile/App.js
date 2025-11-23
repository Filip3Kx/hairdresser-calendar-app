import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  FlatList,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The backend is running in another container. From the Android emulator's perspective,
// the host machine (which exposes the backend port) is accessible at 10.0.2.2.
const API_HOST = 'http://calendar_app_backend:5000';

const App = () => {
  const [apiKey, setApiKey] = useState(null);
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('login'); // 'login' or 'register'

  // Add appointment UI state
  const [modalVisible, setModalVisible] = useState(false);
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [serviceDuration, setServiceDuration] = useState(60);
  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
  const [startTime, setStartTime] = useState(''); // HH:MM
  const [nameField, setNameField] = useState('');
  const [surnameField, setSurnameField] = useState('');
  const [emailField, setEmailField] = useState('');
  const [phoneField, setPhoneField] = useState('');

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

  // When apiKey changes (login) fetch bookings and services
  useEffect(() => {
    if (apiKey) {
      refreshBookings();
      fetchServices();
    }
  }, [apiKey]);

  const refreshBookings = async () => {
    try {
      const res = await fetch(`${API_HOST}/bookings/get`, {
        headers: {
          Authorization: apiKey || '',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch bookings');
      }
      const data = await res.json();
      // map to simple objects
      const formatted = data.map((b) => ({
        id: b.id,
        title: `${b.name} ${b.surname}`,
        start: b.start_time,
        end: b.end_time,
      }));
      setEvents(formatted);
    } catch (err) {
      console.error('Error fetching bookings', err);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_HOST}/bookings/servicesGet`);
      if (!res.ok) return;
      const data = await res.json();
      setServices(data);
      if (data.length > 0) {
        setServiceId(String(data[0].id));
        setServiceDuration(data[0].duration || 60);
      }
    } catch (err) {
      console.error('Failed to load services', err);
    }
  };

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
      // clear mobile-specific fields
      setEvents([]);
      setServices([]);
    } catch (error) {
      Alert.alert('Logout Error', 'Failed to log out.');
    }
  };

  // If user is logged in, show calendar and booking UI
  if (apiKey) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Booking Calendar</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <Button title="Logout" onPress={handleLogout} color="#ff6347" />
          <Button title="Add Appointment" onPress={() => setModalVisible(true)} />
        </View>

        <Text style={{ marginTop: 12, marginBottom: 6, fontWeight: '600' }}>Upcoming bookings</Text>
        <FlatList
          data={events.sort((a,b)=> new Date(a.start)-new Date(b.start))}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={{ padding: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: '600' }}>{item.title}</Text>
              <Text>{new Date(item.start).toLocaleString()} - {new Date(item.end).toLocaleTimeString()}</Text>
            </View>
          )}
          style={{ width: '100%', marginTop: 8 }}
          ListEmptyComponent={<Text>No bookings found.</Text>}
        />

        <Modal visible={modalVisible} animationType="slide">
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.title}>Add Appointment</Text>

            <TextInput style={styles.input} placeholder="Name" value={nameField} onChangeText={setNameField} />
            <TextInput style={styles.input} placeholder="Surname" value={surnameField} onChangeText={setSurnameField} />
            <TextInput style={styles.input} placeholder="Email" value={emailField} onChangeText={setEmailField} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Phone" value={phoneField} onChangeText={setPhoneField} />

            <Text style={{ marginTop: 8 }}>Date (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="2025-12-01" value={startDate} onChangeText={setStartDate} />
            <Text style={{ marginTop: 8 }}>Time (HH:MM)</Text>
            <TextInput style={styles.input} placeholder="14:30" value={startTime} onChangeText={setStartTime} />

            <Text style={{ marginTop: 8 }}>Service</Text>
            {services.map((s) => (
              <TouchableOpacity key={s.id} onPress={() => { setServiceId(String(s.id)); setServiceDuration(s.duration || 60); }} style={{ padding: 8, backgroundColor: serviceId==String(s.id)?'#ddd':'#fff', marginVertical: 4, borderRadius:4 }}>
                <Text>{s.name} ({s.duration} min)</Text>
              </TouchableOpacity>
            ))}

            <View style={{ marginTop: 12 }}>
              <Button title="Create" onPress={async () => {
                // validate
                if (!startDate || !startTime) { Alert.alert('Validation', 'Please provide date and time'); return; }
                const dt = new Date(startDate + 'T' + startTime + ':00');
                if (isNaN(dt.getTime())) { Alert.alert('Validation', 'Invalid date/time'); return; }
                const end = new Date(dt.getTime() + (serviceDuration||60)*60000);

                const payload = {
                  name: nameField,
                  surname: surnameField,
                  email: emailField,
                  phone: phoneField,
                  service: parseInt(serviceId) || 0,
                  start_time: dt.toISOString(),
                  end_time: end.toISOString(),
                };

                const url = apiKey ? `${API_HOST}/bookings/create` : `${API_HOST}/bookings/createGuest`;
                const headers = { 'Content-Type': 'application/json' };
                if (apiKey) headers['Authorization'] = apiKey;

                try {
                  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
                  const text = await res.text();
                  if (!res.ok) throw new Error(text || 'Failed to create booking');
                  Alert.alert('Success', 'Booking created');
                  setModalVisible(false);
                  // reset fields
                  setNameField(''); setSurnameField(''); setEmailField(''); setPhoneField(''); setStartDate(''); setStartTime('');
                  refreshBookings();
                } catch (err) {
                  Alert.alert('Error', err.message || String(err));
                }
              }} />
              <View style={{ height: 10 }} />
              <Button title="Cancel" color="#888" onPress={() => setModalVisible(false)} />
            </View>
          </ScrollView>
        </Modal>
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