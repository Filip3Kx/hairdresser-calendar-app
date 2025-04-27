import React from "react";

const Register = () => {
  const handleRegister = async () => {
    const name = prompt("Enter your name:");
    const surname = prompt("Enter your surname:");
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
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
    } catch (error) {
      console.error("Error registering:", error);
    }
  };

  return <button onClick={handleRegister}>Register</button>;
};

export default Register;