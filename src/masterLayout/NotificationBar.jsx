// src/components/NotificationBar.jsx
import React, { useContext } from "react";
import { AppContext } from "../context/AppContext";

const NotificationBar = () => {
  const { notification, setNotification } = useContext(AppContext);

  if (!notification) return null;
  return (
    <div className={`notification-bar ${notification.type}`}>
      <div className="noti_div1">
        <img src="/assets/images/SMV_icon.png" alt="" />
        <p>SMV Admin</p>
      </div>
      <div className="noti_div2">
        <div  className="noti_div21">
        {notification?.data?.name[0]}
        </div>
        <div className="noti_div22">
        <span>{notification?.data?.name}</span>
        <p>{notification.message}</p>
        </div>
      </div>
      <button className="close-btn" onClick={() => setNotification(null)}>×</button>
    </div>
  );
};

export default NotificationBar;
