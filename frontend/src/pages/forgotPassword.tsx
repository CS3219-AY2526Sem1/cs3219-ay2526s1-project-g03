import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useMutation} from '@tanstack/react-query';
import PeerPrepIcon from '../assets/peerprep-icon.svg';
import SuccessIcon from '../assets/tick-icon.svg';
import {forgotPassword} from '../lib/api.ts';
import '../../styles/forgotPassword.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');

  const {
    mutate: sendResetEmail,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: forgotPassword,
  });

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
          <h1>Forgot your password?</h1>
          <p>Provide the email address associated with your account</p>
        </div>

        <form className="form-section">
          {isSuccess && (
            <div className="success">
              <img src={SuccessIcon} alt="Success" className="alert-icon" />
              Email sent! Please check your inbox for more instructions.
            </div>
          )}
          {isError && <div className="error"> {error?.message || 'Invalid credentials'} </div>}
          {!isSuccess && (
            <>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  autoFocus
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmedEmail = email.trim();
                      if (trimmedEmail) sendResetEmail({email: trimmedEmail});
                    }
                  }}
                />
              </div>

              <button
                type="button"
                className="submit-button"
                disabled={isPending || !email.trim()}
                onClick={() => sendResetEmail({email: email.trim()})}
              >
                {isPending ? 'Submitting...' : 'Reset Password'}
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

export default ForgotPassword;
