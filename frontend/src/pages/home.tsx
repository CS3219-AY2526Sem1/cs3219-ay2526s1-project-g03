import React from 'react';
import {Link} from 'react-router-dom';
import PeerPrepIcon from '../assets/peerprep-icon.svg';
import UserIcon from '../assets/user-icon.svg';
import TargetIcon from '../assets/target-icon.svg';
import LightningIcon from '../assets/lightning-icon.svg';
import '../../styles/home.css';

const Home: React.FC = () => (
  <div className="home-wrapper">
    <header className="home-header">
      <div className="logo-container">
        <img src={PeerPrepIcon} alt="PeerPrep" className="header-logo" />
      </div>
      <div className="header-buttons">
        <Link to="/login" className="header-button signin-button">
          Sign In
        </Link>
        <Link to="/register" className="header-button getstarted-button">
          Get Started
        </Link>
      </div>
    </header>

    <main className="home-main">
      <section className="main-section">
        <h1 className="main-title">
          <span className="main-title-blue">Code Together,</span>
          <span className="main-title-black">Learn Faster</span>
        </h1>
        <p className="main-description">
          Practice coding interviews with peers worldwide. Get matched with partners, solve problems
          together, and improve your skills in real-time
        </p>
        <Link to="/login" className="cta-button">
          Start Practicing
        </Link>
      </section>

      <section className="features-section">
        <div className="feature-card">
          <img src={UserIcon} alt="Find Match" className="feature-icon" />
          <h3 className="feature-title">Find Your Match</h3>
          <p className="feature-description">
            Get paired with coding partners at your skills level for productive practice sessions
          </p>
        </div>

        <div className="feature-card">
          <img src={TargetIcon} alt="Targeted Practice" className="feature-icon" />
          <h3 className="feature-title">Targeted Practice</h3>
          <p className="feature-description">
            Choose from various topics and difficulty levels to focus on your weak areas
          </p>
        </div>

        <div className="feature-card">
          <img src={LightningIcon} alt="Real-time Coding" className="feature-icon" />
          <h3 className="feature-title">Real-time Coding</h3>
          <p className="feature-description">
            Code together in real-time with integrated voice chat and collaborative editor
          </p>
        </div>
      </section>
    </main>
  </div>
);

export default Home;
