import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Calendar from "./components/Calendar";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import Logout from "./components/Logout";
import { fetchBookings } from "./utils/api";

const App = () => {
  const [events, setEvents] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const apiKey = Cookies.get("apiKey");
    if (apiKey) {
      setIsLoggedIn(true);
      fetchBookings(apiKey, setEvents);
    }
  }, []);

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
      <Calendar events={events} />
      {showLogin && (
        <LoginModal
          setIsLoggedIn={setIsLoggedIn}
          setEvents={setEvents}
          onClose={() => setShowLogin(false)}
        />
      )}
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
    </div>
  );
};

export default App;