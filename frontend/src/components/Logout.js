import React from "react";
import Cookies from "js-cookie";

const Logout = ({ setIsLoggedIn, setEvents }) => {
  const handleLogout = () => {
    Cookies.remove("apiKey");
    setIsLoggedIn(false);
    setEvents([]);
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default Logout;