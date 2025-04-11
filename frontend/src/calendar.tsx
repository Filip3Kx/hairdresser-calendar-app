import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState } from 'react';

export default function Calendar() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/bookings/get', {
          method: 'GET',
        });
        if (response.ok) {
          const bookings = await response.json();
          const mappedEvents = bookings.map((booking) => {
            // Extract time (HH:MM) from start_time and end_time
            const startTime = booking.start_time.split('T')[1].slice(0, 5); // Extract HH:MM
            const endTime = booking.end_time.split('T')[1].slice(0, 5);     // Extract HH:MM

            // Combine date with extracted time
            const start = `${booking.date.split('T')[0]}T${startTime}`;
            const end = `${booking.date.split('T')[0]}T${endTime}`;

            return {
              title: 'Taken',
              start: new Date(start).toISOString(), // Convert to ISO 8601 format
              end: new Date(end).toISOString(),     // Convert to ISO 8601 format
              allDay: false,
            };
          });
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

  const handleDateSelect = async (selectInfo) => {
    const startTime = prompt('Enter the start time (HH:MM):');
    const endTime = prompt('Enter the end time (HH:MM):');
    const name = prompt('Enter your name:');
    const surname = prompt('Enter your surname:');
    const email = prompt('Enter your email:');
  
    if (!name || !surname || !email || !startTime || !endTime) {
      alert('All fields are required to create a booking.');
      return;
    }
  
    const selectedDate = selectInfo.startStr.split('T')[0];
    const newStart = new Date(`${selectedDate}T${startTime}`);
    const newEnd = new Date(`${selectedDate}T${endTime}`);
    if (isNaN(newStart.getTime())) {
      alert('Invalid start time format. Use HH:MM.');
      return;
    }
    if (isNaN(newEnd.getTime())) {
      alert('Invalid end time format. Use HH:MM.');
      return;
    }
    if (newStart >= newEnd) {
      alert('End time must be after start time.');
      return;
    }
    const sameDayEvents = events.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart.toLocaleDateString('en-CA') === selectedDate;
    });
    const hasConflict = sameDayEvents.some(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return newStart < eventEnd && newEnd > eventStart;
    });
    if (hasConflict) {
      alert('This time slot conflicts with an existing appointment.');
      return;
    }
  
    // Proceed to create booking
    const booking = {
      name,
      surname,
      email,
      date: selectInfo.startStr,
      start_time: startTime,
      end_time: endTime,
    };
  
    try {
      const response = await fetch('/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      });
  
      if (response.ok) {
        alert('Booking created!');
        window.location.reload();
      } else {
        const errorText = await response.text();
        alert(`Failed: ${errorText}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      selectable={true}
      events={events}
      select={handleDateSelect}
      eventContent={(eventInfo) => {
        const startTime = new Date(eventInfo.event.start).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        const endTime = new Date(eventInfo.event.end).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div>
            <span style={{ color: eventInfo.event.backgroundColor || 'red' }}>●</span>{' '}
            <b>{startTime} - {endTime}</b> {/* Custom time range */}
            <span> {eventInfo.event.title}</span> {/* Event title */}
          </div>
        );
      }}
    />
  );
}