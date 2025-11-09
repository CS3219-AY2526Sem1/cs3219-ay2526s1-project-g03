import useAuth from '../hooks/useAuth';
import '../../styles/authContainer.css';
import UserMenu from './userMenu';
import {Navigate, Outlet, useLocation, matchPath} from 'react-router-dom';

const AuthContainer: React.FC = () => {
  const {user, isLoading} = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }
  if (user) {
    if (!user.profileComplete && window.location.pathname !== '/complete-profile') {
      console.log('do i make it here bro');
      console.log(user);
      console.log('profile complete is ', user.profileComplete);
      return <Navigate to="/complete-profile" replace />;
    }
    const isVerified = user.verified || user.googleOAuthVerified || user.githubOAuthVerified;
    if (!isVerified && window.location.pathname !== '/') {
      return <Navigate to="/" replace />;
    }

    // Hide header for collaboration page
    const hideHeaderRoutes = ['/room/:roomId'];
    const shouldHideHeader = hideHeaderRoutes.some(route => matchPath(route, location.pathname));

    return (
      <div className="container">
        {!shouldHideHeader && <UserMenu />}
        <Outlet />
      </div>
    );
  }

  return (
    <Navigate
      to="/home"
      replace
      state={{
        redirectUrl: window.location.pathname,
      }}
    />
  );
};

export default AuthContainer;
