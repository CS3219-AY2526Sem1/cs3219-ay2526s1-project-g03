import React, {useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import PeerPrepIcon from '../assets/peerprep-icon.svg';
import ErrorIcon from '../assets/alert-icon.svg';
import {resetPassword} from '../lib/api.ts';
import '../../styles/resetPassword.css';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const verificationCode = searchParams.get('code');
  const exp = Number(searchParams.get('exp'));
  const now = Date.now();
  const isValid = verificationCode && exp && now < exp;

  const [password, setPassword] = useState('');
  const [countdown, setCountDown] = useState(3);

  const {
    mutate: updatePassword,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: resetPassword,
  });

  React.useEffect(() => {
    if (isSuccess) {
      const timer = setInterval(() => {
        setCountDown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login', {
              replace: true,
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSuccess, navigate]);

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <Link to="/Home" className="back-link">
          <span className="back-arrow" />
          <span>Back to Home</span>
        </Link>

        <div className="logo-section">
          <img src={PeerPrepIcon} alt="PeerPrep" className="logo-icon" />
        </div>

        <div className="heading">
          <h1>Reset your password</h1>
        </div>

        <form className="form-section">
          {!isValid && (
            <div className="error">
              <img src={ErrorIcon} alt="Error" className="alert-icon" />
              <Link to="/password/forgot" className="reset-link">
                Invalid link! Request a new link
              </Link>
            </div>
          )}
          {isError && <div className="error"> {error?.message || 'Invalid password'} </div>}
          {isSuccess && (
            <div className="success">
              Success! Redirecting to{' '}
              <Link to="/login" className="success-link">
                login page
              </Link>{' '}
              in {countdown} second{countdown !== 1 ? 's' : ''}...
            </div>
          )}
          {isValid && (
            <>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  autoFocus
                  type="password"
                  id="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmedPassword = password.trim();
                      if (trimmedPassword) updatePassword({verificationCode, trimmedPassword});
                    }
                  }}
                />
              </div>

              <button
                type="button"
                className="submit-button"
                disabled={isPending || !password.trim()}
                onClick={() =>
                  updatePassword({
                    verificationCode: verificationCode,
                    password: password.trim(),
                  })
                }
              >
                {isPending ? 'Updating...' : 'Reset Password'}
              </button>
            </>
          )}
          <div className="login-link">
            <Link to="/login">Sign in</Link>
            <span>or</span>
            <Link to="/register">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
