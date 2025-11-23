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
// we use the backend's IP in the Docker network.
const API_HOST = 'http://172.19.0.5:5000';

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

  // Edit booking state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

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
      // map to objects with all needed fields
      const formatted = (data || []).map((b) => ({
        id: b.id,
        title: `${b.name} ${b.surname}`,
        name: b.name,
        surname: b.surname,
        email: b.email,
        phone: b.phone,
        service: b.service,
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

  const handleDeleteBooking = async (bookingId) => {
    Alert.alert(
      'Delete Booking',
      'Are you sure you want to delete this booking?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'DELETE',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_HOST}/bookings/delete`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': apiKey,
                },
                body: JSON.stringify({ id: parseInt(bookingId) }),
              });
              
              if (!response.ok) {
                throw new Error('Failed to delete booking');
              }
              
              Alert.alert('Success', 'Booking deleted successfully');
              refreshBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete booking: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleEditBooking = (booking) => {
    // Load booking data for editing
    const startDateTime = new Date(booking.start);
    const endDateTime = new Date(booking.end);
    
    setEditingBooking({
      id: booking.id,
      name: booking.name,
      surname: booking.surname,
      email: booking.email,
      phone: booking.phone,
      service: booking.service,
      startDate: startDateTime.toISOString().split('T')[0],
      startTime: startDateTime.toISOString().split('T')[1].substring(0, 5),
      endTime: endDateTime.toISOString().split('T')[1].substring(0, 5),
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;

    // Walidacja
    if (!editingBooking.name || !editingBooking.surname || !editingBooking.email) {
      Alert.alert('Validation Error', 'Name, surname and email are required');
      return;
    }

    try {
      const startDateTime = new Date(editingBooking.startDate + 'T' + editingBooking.startTime + ':00');
      const endDateTime = new Date(editingBooking.startDate + 'T' + editingBooking.endTime + ':00');

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        Alert.alert('Validation Error', 'Invalid date or time format');
        return;
      }

      const payload = {
        id: parseInt(editingBooking.id),
        name: editingBooking.name.trim(),
        surname: editingBooking.surname.trim(),
        email: editingBooking.email.trim(),
        phone: editingBooking.phone || '',
        service: parseInt(editingBooking.service) || 1,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      };

      const response = await fetch(`${API_HOST}/bookings/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update booking');
      }

      Alert.alert('Success', 'Booking updated successfully');
      setEditModalVisible(false);
      setEditingBooking(null);
      refreshBookings();
    } catch (error) {
      Alert.alert('Error', 'Failed to update: ' + error.message);
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
            <View style={{ padding: 10, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 16 }}>{item.title}</Text>
                  <Text style={{ color: '#666', marginTop: 4 }}>{new Date(item.start).toLocaleString()} - {new Date(item.end).toLocaleTimeString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity 
                    onPress={() => handleEditBooking(item)}
                    style={{ padding: 8, backgroundColor: '#4CAF50', borderRadius: 4, marginRight: 8 }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>EDIT</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDeleteBooking(item.id)}
                    style={{ padding: 8, backgroundColor: '#ff4444', borderRadius: 4 }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>DELETE</Text>
                  </TouchableOpacity>
                </View>
              </View>
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

        <Modal visible={editModalVisible} animationType="slide">
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.title}>Edit Booking</Text>

            {editingBooking && (
              <>
                <TextInput 
                  style={styles.input} 
                  placeholder="Name" 
                  value={editingBooking.name} 
                  onChangeText={(text) => setEditingBooking({...editingBooking, name: text})} 
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Surname" 
                  value={editingBooking.surname} 
                  onChangeText={(text) => setEditingBooking({...editingBooking, surname: text})} 
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Email" 
                  value={editingBooking.email} 
                  onChangeText={(text) => setEditingBooking({...editingBooking, email: text})} 
                  keyboardType="email-address" 
                />
                <TextInput 
                  style={styles.input} 
                  placeholder="Phone" 
                  value={editingBooking.phone} 
                  onChangeText={(text) => setEditingBooking({...editingBooking, phone: text})} 
                />

                <Text style={{ marginTop: 8 }}>Date (YYYY-MM-DD)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="2025-12-01" 
                  value={editingBooking.startDate} 
                  onChangeText={(text) => setEditingBooking({...editingBooking, startDate: text})} 
                />
                
                <Text style={{ marginTop: 8 }}>Start Time (HH:MM)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="14:30" 
                  value={editingBooking.startTime} 
                  onChangeText={(text) => setEditingBooking({...editingBooking, startTime: text})} 
                />
                
                <Text style={{ marginTop: 8 }}>End Time (HH:MM)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="15:30" 
                  value={editingBooking.endTime} 
                  onChangeText={(text) => setEditingBooking({...editingBooking, endTime: text})} 
                />

                <Text style={{ marginTop: 8 }}>Service</Text>
                {services.map((s) => (
                  <TouchableOpacity 
                    key={s.id} 
                    onPress={() => setEditingBooking({...editingBooking, service: s.id})} 
                    style={{ 
                      padding: 8, 
                      backgroundColor: editingBooking.service==s.id?'#ddd':'#fff', 
                      marginVertical: 4, 
                      borderRadius:4 
                    }}
                  >
                    <Text>{s.name} ({s.duration} min)</Text>
                  </TouchableOpacity>
                ))}

                <View style={{ marginTop: 12 }}>
                  <Button title="Save Changes" onPress={handleSaveEdit} />
                  <View style={{ height: 10 }} />
                  <Button title="Cancel" color="#888" onPress={() => { setEditModalVisible(false); setEditingBooking(null); }} />
                </View>
              </>
            )}
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