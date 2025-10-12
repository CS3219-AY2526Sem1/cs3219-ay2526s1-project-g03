import {useQuery} from '@tanstack/react-query';
import {Link, useParams} from 'react-router-dom';
import {verifyEmail} from '../lib/api';
import SuccessIcon from '../assets/tick-icon.svg';
import ErrorIcon from '../assets/alert-icon.svg';
import '../../styles/verifyEmail.css';

const VerifyEmail: React.FC = () => {
  const {code} = useParams();
  const {isPending, isSuccess, isError} = useQuery({
    queryKey: ['emailVerification', code],
    queryFn: () => verifyEmail(code),
  });

  return (
    <div className="verify-wrapper">
      <div className="verify-container">
        {isPending ? (
          <div className="spinner" />
        ) : (
          <>
            <div className={`alert ${isSuccess ? 'alert-success' : 'alert-error'}`}>
              {isSuccess ? (
                <img src={SuccessIcon} alt="Success" className="alert-icon" />
              ) : (
                <img src={ErrorIcon} alt="Error" className="alert-icon" />
              )}
              <span className="alert-text">
                {isSuccess ? ' Email verified!' : ' Invalid link!'}{' '}
              </span>
            </div>

            {isError && (
              <p className="error-message">
                The link is either invalid or expired.
                <br />
                <Link to="/register" className="link">
                  Get a new link.
                </Link>
              </p>
            )}

            <Link to="/" className="back-link">
              <span className="back-arrow" />
              <span>Back to Home</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
