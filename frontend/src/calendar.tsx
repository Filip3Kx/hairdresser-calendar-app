import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function Calendar() {
  const handleDateSelect = (selectInfo) => {
    const title = prompt('New Booking:');
    if (title) {
      fetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ title, date: selectInfo.startStr }),
      });
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
