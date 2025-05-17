import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Calendar from "./components/Calendar";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import Logout from "./components/Logout";
import AddAppointmentModal from "./components/AddAppointmentModal";
import { fetchBookings } from "./utils/api";

const App = () => {
  const [events, setEvents] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const refreshBookings = () => {
    const apiKey = Cookies.get("apiKey");
    if (apiKey) {
      setIsLoggedIn(true);
      fetchBookings(apiKey, setEvents);
    } else {
      setIsLoggedIn(false);
      fetchBookings("", setEvents);
    }
  };

  useEffect(() => {
    refreshBookings();
  }, []);

  // Prevent background interaction when modal is open
  useEffect(() => {
    if (showLogin || showRegister || showAddModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  }, [showLogin, showRegister, showAddModal]);

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    setShowAddModal(true);
  };

  return (
    <div>
      <h1>Booking Calendar</h1>
      <div style={{ marginBottom: "20px" }}>
        {!isLoggedIn ? (
          <>
            <button onClick={() => setShowLogin(true)}>Login</button>
            <button onClick={() => setShowRegister(true)}>Register</button>
          </>
        ) : (
          <Logout setIsLoggedIn={setIsLoggedIn} setEvents={setEvents} />
        )}
      </div>
      <Calendar events={events} onDateClick={handleDateClick} />
      {showLogin && (
        <LoginModal
          setIsLoggedIn={setIsLoggedIn}
          setEvents={setEvents}
          onClose={() => setShowLogin(false)}
        />
      )}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
      {showAddModal && (
        <AddAppointmentModal
          date={selectedDate}
          onClose={() => setShowAddModal(false)}
          isLoggedIn={isLoggedIn}
          refreshBookings={refreshBookings}
        />
      )}
    </div>
  );
};

export default App;