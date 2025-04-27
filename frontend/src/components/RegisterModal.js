// filepath: /home/test/calendar/frontend/src/components/RegisterModal.js
import React, { useState } from "react";

const RegisterModal = ({ onClose }) => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, surname, email, password }),
      });
      if (!response.ok) {
        throw new Error("Registration failed");
      }
      alert("Registration successful! Please log in.");
      onClose();
    } catch (error) {
      console.error("Error registering:", error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Register</h2>
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
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleRegister}>Register</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default RegisterModal;