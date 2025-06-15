import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Logout from "./Logout";

const AdminPage = ({ setIsLoggedIn, setEvents }) => {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    // Fetch services and build a map of id -> name
    fetch("/bookings/servicesGet")
      .then((res) => res.json())
      .then((data) => {
        const serviceMap = {};
        data.forEach((s) => {
          serviceMap[s.id] = s.name;
        });
        setServices(serviceMap);
      });
  }, []);

  const fetchBookings = () => {
    const apiKey = Cookies.get("apiKey");
    fetch("/bookings/get", {
      headers: { Authorization: apiKey },
    })
      .then((res) => res.json())
      .then((data) => {
        // Filter for upcoming bookings only
        const now = new Date();
        const upcoming = data.filter(
          (b) => new Date(b.end_time) > now
        );
        // Sort by start time
        upcoming.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        setBookings(upcoming);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = (id) => {
    const apiKey = Cookies.get("apiKey");
    const bookingId = parseInt(id, 10);
    fetch("/bookings/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ id: bookingId }),
    })
      .then((res) => {
        if (res.ok) {
          fetchBookings();
        } else {
          res.text().then((msg) => alert("Failed to cancel booking: " + msg));
        }
      })
      .catch((err) => alert("Error: " + err));
  };

  const handleEditClick = (booking) => {
    setEditingId(booking.id);
    setEditForm({
      ...booking,
      service: booking.service,
      start_time: booking.start_time.slice(0, 16), // for input type="datetime-local"
      end_time: booking.end_time.slice(0, 16),
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditSave = () => {
    const apiKey = Cookies.get("apiKey");
    const payload = {
      id: parseInt(editForm.id, 10),
      name: editForm.name,
      surname: editForm.surname,
      email: editForm.email,
      phone: editForm.phone,
      service: parseInt(editForm.service, 10),
      start_time: new Date(editForm.start_time).toISOString(),
      end_time: new Date(editForm.end_time).toISOString(),
    };
    fetch("/bookings/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.ok) {
          setEditingId(null);
          fetchBookings();
        } else {
          res.text().then((msg) => alert("Failed to update booking: " + msg));
        }
      })
      .catch((err) => alert("Error: " + err));
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <Logout setIsLoggedIn={setIsLoggedIn} setEvents={setEvents} />
      <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #ccc", marginTop: "20px", padding: "10px" }}>
        <h3>Upcoming Bookings</h3>
        {bookings.length === 0 ? (
          <p>No upcoming bookings.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {bookings.map((b) => (
              <li key={b.id} style={{ marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
                {editingId === b.id ? (
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      name="surname"
                      value={editForm.surname}
                      onChange={handleEditChange}
                      placeholder="Surname"
                    />
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      placeholder="Email"
                    />
                    <input
                      type="text"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      placeholder="Phone"
                    />
                    <select
                      name="service"
                      value={editForm.service}
                      onChange={handleEditChange}
                    >
                      {Object.entries(services).map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>
                    <input
                      type="datetime-local"
                      name="start_time"
                      value={editForm.start_time}
                      onChange={handleEditChange}
                    />
                    <input
                      type="datetime-local"
                      name="end_time"
                      value={editForm.end_time}
                      onChange={handleEditChange}
                    />
                    <button onClick={handleEditSave} style={{ marginRight: "5px" }}>Save</button>
                    <button onClick={handleEditCancel}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    <strong>{b.name} {b.surname}</strong><br />
                    Email: {b.email}<br />
                    Phone: {b.phone}<br />
                    Service: {services[b.service] || b.service}<br />
                    Start: {new Date(b.start_time).toLocaleString()}<br />
                    End: {new Date(b.end_time).toLocaleString()}<br />
                    <button onClick={() => handleEditClick(b)} style={{ marginTop: "5px", marginRight: "5px" }}>
                      Edit
                    </button>
                    <button onClick={() => handleCancel(b.id)} style={{ marginTop: "5px" }}>
                      Cancel Reservation
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminPage;