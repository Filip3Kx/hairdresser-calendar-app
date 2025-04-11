import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function Calendar() {
  const handleDateSelect = async (selectInfo) => {
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
        const response = await fetch('/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(booking),
        });

        if (response.ok) {
          alert('Booking created successfully!');
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
      events="/api/bookings" // Auto-fetch
      select={handleDateSelect}
    />
  );
}