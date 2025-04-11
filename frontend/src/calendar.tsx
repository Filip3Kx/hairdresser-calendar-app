import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState } from 'react';

export default function Calendar() {
  const [events, setEvents] = useState([]);

  // Fetch bookings from the backend
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/bookings/get', {
          method: 'GET',
        });
        if (response.ok) {
          const bookings = await response.json();
          // Map bookings to FullCalendar event format
          const mappedEvents = bookings.map((date) => ({
            title: 'Taken',
            start: date,
            allDay: true,
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

const handleDateSelect = async (selectInfo) => {
  const isTaken = events.some(
    (event) =>
      new Date(event.start).toISOString().split('T')[0] === selectInfo.startStr
  );

  if (isTaken) {
    alert('This date is already booked!');
    return; // prevent further execution
  }

  const name = prompt('Enter your name:');
  const surname = prompt('Enter your surname:');
  const email = prompt('Enter your email:');

  if (name && surname && email) {
    const booking = {
      name,
      surname,
      email,
      date: selectInfo.startStr,
    };

    try {
      const response = await fetch('/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking),
      });

      if (response.ok) {
        alert('Booking created successfully!');
        // Add the new booking to the events
        setEvents((prevEvents) => [
          ...prevEvents,
          { title: 'Taken', start: selectInfo.startStr, allDay: true },
        ]);
      } else {
        const errorText = await response.text();
        alert(`Failed to create booking: ${errorText}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  } else {
    alert('All fields are required to create a booking.');
  }
};

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      selectable={true}
      events={events} // Use the fetched events
      select={handleDateSelect}
    />
  );
}