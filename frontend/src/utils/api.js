export const fetchBookings = async (apiKey, setEvents) => {
  try {
    const response = await fetch("/bookings/get", {
      headers: {
        Authorization: apiKey,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch bookings");
    }
    const data = await response.json();
    const formattedEvents = data.map((booking) => ({
      id: booking.id,
      title: `${booking.name} ${booking.surname}`,
      start: booking.start_time,
      end: booking.end_time,
    }));
    setEvents(formattedEvents);
  } catch (error) {
    console.error("Error fetching bookings:", error);
  }
};