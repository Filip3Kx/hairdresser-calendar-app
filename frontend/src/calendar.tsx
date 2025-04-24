import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState, useRef } from 'react';
import Cookies from 'js-cookie';
import './styles.css';

export default function Calendar() {
  const [adminModal, setAdminModal] = useState({ show: false, event: null });
  const [editData, setEditData] = useState(null);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    name: '',
    surname: '',
    email: '',
  });

  // Autofill booking form with user info when form opens and user is logged in
  useEffect(() => {
    const apiKey = Cookies.get('apiKey');
    if (showForm && apiKey) {
      fetch('/auth/userinfo', {
        method: 'GET',
        headers: {
          'Authorization': apiKey
        }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch user info');
          return res.json();
        })
        .then(data => {
          setFormData(prev => ({
            ...prev,
            name: data.name || '',
            surname: data.surname || '',
            email: data.email || ''
          }));
        })
        .catch(() => {});
    }
  }, [showForm]);
  const [authData, setAuthData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
  });
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/bookings/get', { 
          method: 'GET',
          headers: {
            'Authorization': `${Cookies.get('apiKey') || ''}`
          }
        });
        if (response.ok) {
          const bookings = await response.json();
          const mappedEvents = bookings.map((booking) => ({
            title: booking.user_id ? 'Your booking' : 'Taken',
            start: new Date(`${booking.date.split('T')[0]}T${booking.start_time.split('T')[1].slice(0, 5)}`).toISOString(),
            end: new Date(`${booking.date.split('T')[0]}T${booking.end_time.split('T')[1].slice(0, 5)}`).toISOString(),
            allDay: false,
          }));
          setEvents(mappedEvents);
        } else {
          console.error('Failed to fetch bookings');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData),
      });
      if (response.ok) {
        alert('Registration successful!');
        setShowRegister(false);
      } else {
        const errorText = await response.text();
        alert(`Registration failed: ${errorText}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Login successful!`);
        Cookies.set('apiKey', data.api_key, { expires: 7 });
        setShowLogin(false);
      } else {
        const errorText = await response.text();
        alert(`Login failed: ${errorText}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    try {
      const response = await fetch('/auth/check', {
        method: 'GET',
        headers: { 'Authorization': `${Cookies.get('apiKey') || ''}` },
      });
      if (response.ok) {
        Cookies.set('isAdmin', `${Cookies.get('apiKey')}`)        
      } else {
        Cookies.set('isAdmin', '');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    window.location.reload();
  };

  const handleLogout = () => {
    Cookies.remove('apiKey');
    Cookies.remove('isAdmin');
    alert('Logged out successfully!');
    window.location.reload();
  };

  const handleDateSelect = (selectInfo) => {
    setSelectedDate(selectInfo.startStr.split('T')[0]);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, surname, email, startTime, endTime } = formData;
    if (!name || !surname || !email || !startTime || !endTime) {
      alert('All fields are required');
      return;
    }
    const newStart = new Date(`${selectedDate}T${startTime}`);
    const newEnd = new Date(`${selectedDate}T${endTime}`);
    if (isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
      alert('Invalid time format');
      return;
    }
    if (newStart >= newEnd) {
      alert('End time must be after start time');
      return;
    }
    const hasConflict = events.some((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        eventStart.toLocaleDateString('en-CA') === selectedDate &&
        newStart < eventEnd &&
        newEnd > eventStart
      );
    });
    if (hasConflict) {
      alert('This time slot conflicts with an existing appointment');
      return;
    }
    const booking = { name, surname, email, date: selectedDate, start_time: startTime, end_time: endTime };
    try {
      const apiKey = Cookies.get('apiKey'); // Retrieve API key from cookie
      const response = await fetch('/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${apiKey || ''}`, // Include API key in the headers
        },
        body: JSON.stringify(booking),
      });
      if (response.ok) {
        alert('Booking created!');
        setShowForm(false);
        window.location.reload();
      } else {
        const errorText = await response.text();
        alert(`Failed: ${errorText}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const changeView = (view) => {
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };

  const isLoggedIn = !!Cookies.get('apiKey'); // Check if the user is logged in

  return (
    <div className="calendar-container">
      <div className="auth-buttons">
        {!isLoggedIn ? (
          <>
            <button onClick={() => setShowRegister(true)}>Register</button>
            <button onClick={() => setShowLogin(true)}>Login</button>
          </>
        ) : (
          <>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
      <div className="calendar-buttons">
        <button onClick={() => changeView('dayGridMonth')}>Month View</button>
        <button onClick={() => changeView('timeGridWeek')}>Week View</button>
        <button onClick={() => changeView('timeGridDay')}>Day View</button>
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Register</h3>
            <form onSubmit={handleRegister}>
              <label>
                Name:
                <input
                  type="text"
                  required
                  value={authData.name}
                  onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                />
              </label>
              <label>
                Surname:
                <input
                  type="text"
                  required
                  value={authData.surname}
                  onChange={(e) => setAuthData({ ...authData, surname: e.target.value })}
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  required
                  value={authData.email}
                  onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                />
              </label>
              <label>
                Password:
                <input
                  type="password"
                  required
                  value={authData.password}
                  onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                />
              </label>
              <div className="button-group">
                <button type="submit">Register</button>
                <button type="button" onClick={() => setShowRegister(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Login</h3>
            <form onSubmit={handleLogin}>
              <label>
                Email:
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                />
              </label>
              <label>
                Password:
                <input
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />
              </label>
              <div className="button-group">
                <button type="submit">Login</button>
                <button type="button" onClick={() => setShowLogin(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className={`calendar-container ${showForm ? 'disabled' : ''}`}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          selectable={!showForm}
          editable={!showForm}
          events={events}
          select={handleDateSelect}
          eventContent={(eventInfo) => {
            const startTime = new Date(eventInfo.event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(eventInfo.event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div>
                <span style={{ color: eventInfo.event.backgroundColor || 'red' }}>●</span>{' '}
                <b>{startTime} - {endTime}</b>
                <span> {eventInfo.event.title}</span>
              </div>
            );
          }}
          eventClick={(info) => {
            const isAdmin = !!Cookies.get('isAdmin');
            if (isAdmin) {
              info.jsEvent.preventDefault();
              setAdminModal({ show: true, event: info.event });
            }
          }}
        />
      </div>

      {/* Admin Edit/Delete Modal */}
      {adminModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit or Delete Booking</h3>
            <div>
              <p><b>Title:</b> {adminModal.event.title}</p>
              <p><b>Start:</b> {adminModal.event.start?.toLocaleString()}</p>
              <p><b>End:</b> {adminModal.event.end?.toLocaleString()}</p>
            </div>
            <div className="button-group">
              <button onClick={() => {
                // Example: populate edit form data
                setEditData({
                  title: adminModal.event.title,
                  start: adminModal.event.start,
                  end: adminModal.event.end,
                  // Add more fields as needed
                });
                setAdminModal({ show: false, event: null });
                setShowForm(true); // Could be a dedicated edit modal
              }}>Edit</button>
              <button onClick={async () => {
                // Example: delete booking logic
                // You would need to know the booking id, here we assume event.id
                if (window.confirm('Are you sure you want to delete this booking?')) {
                  try {
                    const apiKey = Cookies.get('apiKey');
                    const response = await fetch('/bookings/delete', {
                      method: 'POST',
                      headers: { 'Authorization': `${apiKey || ''}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        date: adminModal.event.startStr.slice(0, 10),
                        start_time: adminModal.event.startStr.slice(11, 16),
                        end_time: adminModal.event.endStr.slice(11, 16)
                      })
                    });
                    if (response.ok) {
                      setAdminModal({ show: false, event: null });
                      window.location.reload();
                    } else {
                      const errorText = await response.text();
                      alert(`Failed: ${errorText}`);
                    }
                  } catch (e) {
                    alert('Failed to delete booking');
                  }
                }
              }}>Delete</button>
              <button onClick={() => setAdminModal({ show: false, event: null })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Appointment for {selectedDate}</h3>
            <div className="form-container">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Start Time:</label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  >
                    <option value="">Select start time</option>
                    <option value="08:00">08:00 AM</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>End Time:</label>
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  >
                    <option value="">Select end time</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Surname:</label>
                  <input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="button-group">
                  <button type="submit" className="submit-button">Submit</button>
                  <button type="button" onClick={() => setShowForm(false)} className="cancel-button">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
      .calendar-container.disabled {
          pointer-events: none;
          opacity: 0.5;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        input {
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .button-group {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button[type='submit'] {
          background: #0070f3;
          color: white;
        }
        button[type='button'] {
          background: #ccc;
        }
      `}</style>
    </div>
  );
}
