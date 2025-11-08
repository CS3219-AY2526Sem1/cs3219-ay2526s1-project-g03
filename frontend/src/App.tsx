import {Route, Routes, useNavigate} from 'react-router-dom';
import Home from './pages/home';
import Register from './pages/register';
import Login from './pages/login';
import Input from './collaboration/pages/Input';
import {CollabPage} from './collaboration/pages/CollabPage';
import { Toaster } from 'react-hot-toast';
import VerifyEmail from './pages/verifyEmail';
import Profile from './pages/profile';
import AuthContainer from './components/authContainer';
import {setNavigate} from './lib/navigation';
import ForgotPassword from './pages/forgotPassword';
import ResetPassword from './pages/resetPassword';
import UserProfile from './pages/userProfile';
import ProfileSettings from './pages/profileSettings';
import CompleteProfile from './pages/completeProfile';
import AdminManagement from './pages/adminManagement';
import AdminContainer from './components/adminContainer';
import Dashboard from './pages/dashboard/dashboard'
import HistoryDashboardPage from './pages/HistoryDashboardPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import ResetQuestionsPage from './pages/ResetQuestionsPage';

function App() {
  const navigate = useNavigate();
  setNavigate(navigate); // Allows use of navigate within Axios.
  return (
    <>
      <Toaster />

      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/email/verify/:code" element={<VerifyEmail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/password/forgot" element={<ForgotPassword />} />
        <Route path="/password/reset" element={<ResetPassword />} />
        // Authorized users only (defined as having verfieid email).
        <Route path="/" element={<AuthContainer />}>
          <Route index element={<Profile />} />
          <Route path="profile/" element={<UserProfile />} />
          <Route path="profile/settings" element={<ProfileSettings />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="room" element={<Input />} />
          <Route path="room/:roomId" element={<CollabPage />} />
          <Route path="history" element={<HistoryDashboardPage />} />
          <Route path="history/attempts/:questionId" element={<QuestionDetailPage />} />
          <Route path="history/reset" element={<ResetQuestionsPage />} />
          <Route
            path="admin/manage"
            element={
              <AdminContainer>
                <AdminManagement />
              </AdminContainer>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
