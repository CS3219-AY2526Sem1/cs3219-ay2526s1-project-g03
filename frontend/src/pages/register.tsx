import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import PeerPrepIcon from '../assets/peerprep-icon.svg';
import GoogleIcon from '../assets/google-icon.svg';
import GithubIcon from '../assets/github-icon.svg';
import {register} from '../lib/api.ts';
import '../../styles/register.css';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [oAuthError, setOAuthError] = useState(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      setOAuthError(decodeURIComponent(error));
      window.history.replaceState({}, '', window.location.pathname);
    }
  });

  const {
    mutate: registration,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: register,
    onSuccess: () => {
      navigate('/complete-profile', {
        replace: true, // User cannot go back to page
      });
    },
  });

  return (
    <div className="registration-wrapper">
      <div className="registration-container">
        <Link to="/Home" className="back-link">
          <span className="back-arrow" />
          <span>Back to Home</span>
        </Link>

        <div className="logo-section">
          <img src={PeerPrepIcon} alt="PeerPrep" className="logo-icon" />
        </div>

        <div className="heading">
          <h1>Create your account</h1>
          <p>Join thousands of developers improving together</p>
        </div>

        {oAuthError && (
          <div className="error">{oAuthError || 'An error occurred, please try again.'}</div>
        )}
        <div className="oauth-buttons">
          <button
            className="oauth-button"
            onClick={() =>
              (window.location.href = `${import.meta.env.VITE_USER_SERVICE_URL}/auth/github`)
            }
          >
            <div className="icon-github">
              <img src={GithubIcon} alt="GitHub" className="icon-github" />
            </div>
            <span>Continue with GitHub</span>
          </button>

          <button
            className="oauth-button"
            onClick={() =>
              (window.location.href = `${import.meta.env.VITE_USER_SERVICE_URL}/auth/google`)
            }
          >
            <div className="icon-google">
              <img src={GoogleIcon} alt="Google" className="icon-google" />
            </div>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="divider">or</div>

        <form className="form-section">
          {isError && (
            <div className="error">
              {error?.message
                ? error.message.split('\n').map((msg, idx) => <div key={idx}>{msg}</div>)
                : 'Invalid credentials'}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              autoFocus
              type="text"
              id="username"
              className="form-input"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e =>
                e.key === 'Enter' &&
                registration({
                  username: username.trim(),
                  email: email.trim(),
                  password: password.trim(),
                  confirmPassword: confirmPassword.trim(),
                })
              }
            />
          </div>

          <button
            type="button"
            className="submit-button"
            disabled={isPending}
            onClick={() =>
              registration({
                username: username.trim(),
                email: email.trim(),
                password: password.trim(),
                confirmPassword: confirmPassword.trim(),
              })
            }
          >
            {isPending ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="login-link">
            <span>Already have an account?</span>
            <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
