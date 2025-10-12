import {Route, Routes, useNavigate} from 'react-router-dom';
import Home from './pages/home';
import Register from './pages/register';
import Login from './pages/login';
import Input from './collaboration/pages/Input';
import {CollabPage} from './collaboration/pages/CollabPage';
import VerifyEmail from './pages/verifyEmail';
import Profile from './pages/profile';
import AuthContainer from './components/authContainer';
import {setNavigate} from './lib/navigation';

function App() {
  const navigate = useNavigate();
  setNavigate(navigate); // Allows use of navigate within Axios.
  return (
    <Routes>
      <Route path="/home" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/email/verify/:code" element={<VerifyEmail />} />
      <Route path="/login" element={<Login />} />
      // TODO: password forget, password reset // Authorized users only.
      <Route path="/" element={<AuthContainer />}>
        <Route index element={<Profile />} /> // TODO customization
        {/* <Route path="/logout" element={<Logout />} /> // TODO */}
        <Route path="room" element={<Input />} />
        <Route path="room/:roomId" element={<CollabPage />} />
      </Route>
    </Routes>
  );
}

export default App;
