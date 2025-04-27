import React from "react";
import Cookies from "js-cookie";
import { fetchBookings } from "../utils/api";

const Login = ({ setIsLoggedIn, setEvents }) => {
  const handleLogin = async () => {
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
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
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  return <button onClick={handleLogin}>Login</button>;
};

export default Login;