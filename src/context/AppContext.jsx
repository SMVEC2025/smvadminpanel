import { createContext, useState, useEffect, useCallback } from "react";
// Create Context
export const AppContext = createContext();
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
// Create Provider Component
export function AppProvider({ children }) {
  const [makeNotify,setMakeNotify] = useState(true);
  const [notification, setNotification] = useState(null);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading,setLoading] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const storedSession = JSON.parse(localStorage.getItem('supabaseSession'));
    if (storedSession && storedSession.access_token) {
      setToken(storedSession.access_token);
      setUser(storedSession.user);
    }
  }, []);

  // Login
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    localStorage.setItem('supabaseSession', JSON.stringify(data.session));
    setToken(data.session.access_token);
    setUser(data.session.user);
    
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('supabaseSession');
    setToken(null);
    setUser(null);
    const navigate = useNavigate()

    navigate('/login')
    

  };

  const notify = useCallback(({ data,message, type = "info", duration = 3000 }) => {
    setNotification({ data, message, type });

    setTimeout(() => {
      setNotification(null);
    }, duration);
  }, []);

 

  return (
    <AppContext.Provider
      value={{
        makeNotify, setMakeNotify,notify, notification, setNotification,token, user, login, logout,setToken,setUser,loading, setLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
