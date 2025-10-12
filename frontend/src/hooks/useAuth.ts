import {useQuery} from '@tanstack/react-query';
import {getUser} from '../lib/api';

export const AUTH = 'auth';

const useAuth = (options = {}) => {
  const {data: user, ...rest} = useQuery({
    queryKey: [AUTH],
    queryFn: getUser,
    ...options,
  });
  return {
    user,
    ...rest,
  };
};

export default useAuth;
