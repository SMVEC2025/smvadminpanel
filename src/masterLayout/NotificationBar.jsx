// src/components/NotificationBar.jsx
import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const NotificationBar = () => {
  const { notification, setNotification } = useContext(AppContext);

  if (!notification) return null;

  return (
    <div className={`notification-bar ${notification.type}`}>
      <span>{notification.message}</span>
      <button className="close-btn" onClick={() => setNotification(null)}>×</button>
    </div>
  );
};

export default NotificationBar;
