import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";

const AddAppointmentModal = ({ date, onClose, isLoggedIn, refreshBookings }) => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [serviceDuration, setServiceDuration] = useState(0);
  const [startTime, setStartTime] = useState("");

  useEffect(() => {
    fetch("/bookings/servicesGet")
      .then((res) => res.json())
      .then((data) => {
        setServices(data);
        if (data.length > 0) {
          setServiceId(data[0].id);
          setServiceDuration(data[0].duration || 60); // fallback duration
        }
      });
  }, []);

  useEffect(() => {
    const selected = services.find((s) => s.id === serviceId);
    setServiceDuration(selected ? parseInt(selected.duration) : 60);
  }, [serviceId, services]);

const handleSubmit = async () => {
    const startDate = new Date(date);
    if (startTime) {
        const [hours, minutes] = startTime.split(":").map(Number);
        startDate.setHours(hours, minutes, 0, 0);
    }
    const endDate = new Date(startDate.getTime() + serviceDuration * 60000);

    const payload = {
        name,
        surname,
        email,
        phone,
        service: parseInt(serviceId),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
    };

    const apiKey = Cookies.get("apiKey");
    const url = isLoggedIn ? "/bookings/create" : "/bookings/createGuest";
    const headers = {
        "Content-Type": "application/json",
    };
    if (isLoggedIn && apiKey) {
        headers["Authorization"] = apiKey;
    }

    try {
        const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });
        const responseText = await res.text();
        if (!res.ok) {
            throw new Error(`Failed to create booking. Server response: ${responseText}`);
        }
        refreshBookings();
        onClose();
    } catch (err) {
        alert("Error: " + err.message);
    }
};

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Add Appointment</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Surname"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
        <select
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        <div>
          <button onClick={handleSubmit}>Add</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AddAppointmentModal;