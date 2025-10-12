import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import PeerPrepIcon from '../assets/peerprep-icon.svg';
import GoogleIcon from '../assets/google-icon.svg';
import GithubIcon from '../assets/github-icon.svg';
import {login} from '../lib/api.ts';
import '../../styles/login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const {
    mutate: signIn,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate('/', {
        replace: true, // User cannot go back to page
      });
    },
  });

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <Link to="/" className="back-link">
          <span className="back-arrow" />
          <span>Back to Home</span>
        </Link>

        <div className="logo-section">
          <img src={PeerPrepIcon} alt="PeerPrep" className="logo-icon" />
        </div>

        <div className="heading">
          <h1>Welcome back</h1>
          <p>Sign in to continue your coding journey</p>
        </div>

        <div className="oauth-buttons">
          <button className="oauth-button">
            <div className="icon-github">
              <img src={GithubIcon} alt="GitHub" className="icon-github" />
            </div>
            <span>Continue with GitHub</span>
          </button>

          <button className="oauth-button">
            <div className="icon-google">
              <img src={GoogleIcon} alt="Google" className="icon-google" />
            </div>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="divider">or</div>

        <form className="form-section">
          {isError && <div className="error"> {'Invalid credentials'} </div>}
          <div className="form-group">
            <label htmlFor="identifier">Username or Email</label>
            <input
              autoFocus
              type="text"
              id="identifier"
              className="form-input"
              placeholder="Enter your username or email"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
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
              onKeyDown={e => e.key === 'Enter' && signIn({identifier, password})}
            />
          </div>

          <button
            type="button"
            className="submit-button"
            disabled={isPending}
            onClick={() => signIn({identifier, password})}
          >
            {isPending ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="login-link">
            <span>Don't have an account?</span>
            <Link to="/register">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
