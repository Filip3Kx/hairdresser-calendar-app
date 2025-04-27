import React, { useState } from "react";
import Cookies from "js-cookie";
import { fetchBookings } from "../utils/api";

const LoginModal = ({ setIsLoggedIn, setEvents, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error("Login failed");
      }
      const data = await response.json();
      Cookies.set("apiKey", data.api_key);
      setIsLoggedIn(true);
      fetchBookings(data.api_key, setEvents);
      onClose();
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default LoginModal;