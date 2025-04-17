import { createContext, useState, useEffect, useCallback } from "react";

// Create Context
export const AppContext = createContext();

// Create Provider Component
export function AppProvider({ children }) {
  const [makeNotify,setMakeNotify] = useState(true);
  const [notification, setNotification] = useState(null);
  const notify = useCallback(({ message, type = "info", duration = 3000 }) => {
    setNotification({ message, type });

    setTimeout(() => {
      setNotification(null);
    }, duration);
  }, []);

 

  return (
    <AppContext.Provider
      value={{
        makeNotify, setMakeNotify,notify, notification, setNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
