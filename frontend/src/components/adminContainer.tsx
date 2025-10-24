import {Navigate} from 'react-router-dom';
import useAuth from '../hooks/useAuth';

interface AdminContainerProps {
  children: React.ReactNode;
}

const AdminContainer: React.FC<AdminContainerProps> = ({children}) => {
  const {user} = useAuth();

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminContainer;
