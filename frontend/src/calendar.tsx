import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState, useRef } from 'react';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    name: '',
    surname: '',
    email: '',
  });

  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/bookings/get', { method: 'GET' });
        if (response.ok) {
          const bookings = await response.json();
          const mappedEvents = bookings.map((booking) => ({
            title: 'Taken',
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
      const response = await fetch('/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div>
      <div>
        <button onClick={() => changeView('dayGridMonth')}>Month View</button>
        <button onClick={() => changeView('timeGridWeek')}>Week View</button>
        <button onClick={() => changeView('timeGridDay')}>Day View</button>
      </div>
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
        />
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Appointment for {selectedDate}</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Start Time:
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </label>
              <label>
                End Time:
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </label>
              <label>
                Name:
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </label>
              <label>
                Surname:
                <input
                  type="text"
                  required
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </label>
              <div className="button-group">
                <button type="submit">Create Booking</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
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
