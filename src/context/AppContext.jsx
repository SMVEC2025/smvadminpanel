import { createContext, useState, useEffect } from "react";

// Create Context
export const AppContext = createContext();

// Create Provider Component
export function AppProvider({ children }) {
  const [makeNotify,setMakeNotify] = useState(true);

 

  return (
    <AppContext.Provider
      value={{
        makeNotify, setMakeNotify
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
