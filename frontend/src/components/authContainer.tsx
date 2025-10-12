import useAuth from '../hooks/useAuth';
import '../../styles/authContainer.css';
import UserMenu from './userMenu';
import {Navigate, Outlet} from 'react-router-dom';

const AuthContainer: React.FC = () => {
  const {user, isLoading} = useAuth();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }
  if (user) {
    return (
      <div className="container">
        <UserMenu />
        <Outlet />
      </div>
    );
  }

  return (
    <Navigate
      to="/login"
      replace
      state={{
        redirectUrl: window.location.pathname,
      }}
    />
  );
};

export default AuthContainer;
