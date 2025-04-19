// Login.jsx
import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { login } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading,setLoading]=useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    try {
      await login(email, password);
    setLoading(false)
      
      navigate('/')
    } catch (err) {
      alert('Login failed: ' + err.message);
    setLoading(false)

    }
  };

  return (
    <div className="admin-login-container">
    <div className="admin-login-form">
       <div className='admin-title-div'>
       <img src='/assets/images/logofull.png' alt="" />
       <h2 className="admin-title">-Admin</h2>
       </div>
       <form onSubmit={handleSubmit}>
      <input type="email" placeholder="email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="password" onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">{loading?"Loading..":"Login"}</button>
    </form>
    </div>
  </div>
  );
};

export default Login;
