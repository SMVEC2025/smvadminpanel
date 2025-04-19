import { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const ProtectedRoute = ({ children }) => {
  const {setToken,setUser,logout} = useContext(AppContext)
  const token = localStorage.getItem("supabaseSession");

  useEffect(() => {
    const token = localStorage.getItem("supabaseSession");
    const expiresAt = token?.expires_at  
    if (token && expiresAt) {
      const now = Math.floor(Date.now() / 1000); // current time in seconds
      if (now < parseInt(expiresAt)) {
        setToken(token);
        setUser(JSON.parse(localStorage.getItem("user")));
      } else {
        // Token expired
        logout();
      }
    }
  }, []);
  
  if (!token) {
    return <Navigate to="/login"  />;
  }

  return children;
};

export default ProtectedRoute;