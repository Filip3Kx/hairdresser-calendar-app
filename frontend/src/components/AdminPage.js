import React from "react";
import Logout from "./Logout";

const AdminPage = ({ setIsLoggedIn, setEvents }) => {
  return (
    <div>
      <h2>Admin Panel</h2>
      <Logout setIsLoggedIn={setIsLoggedIn} setEvents={setEvents} />
    </div>
  );
};

export default AdminPage;