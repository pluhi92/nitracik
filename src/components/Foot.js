import React from "react";
import { Link } from "react-router-dom";
import "../styles/components/Foot.css";
import logo from "../assets/logo.png";
import { FaInstagram, FaFacebookF } from "react-icons/fa";

const Foot = () => {
  
  const handleCookiePreferences = (e) => {
    e.preventDefault();
    // Check if the CookieConsent component is available and call its function
    if (window.openCookieSettings) {
      window.openCookieSettings();
    }
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Left column */}
        <div className="footer-col footer-brand">
          <img src={logo} alt="Nitracik Logo" className="footer-logo" />
          <p className="footer-text">Tešíme sa na Vás!</p>
          <span className="footer-phone">+421 949 584 576</span>
          <a href="mailto:info@nitracik.sk" className="footer-email">
            info@nitracik.sk
          </a>
          <div className="footer-socials">
            <a
              href="https://www.facebook.com/people/Nitr%C3%A1%C4%8Dik/61558994166250/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF className="social-icon" />
            </a>
            <a
              href="https://www.instagram.com/nitracik"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram className="social-icon" />
            </a>
          </div>
        </div>

        {/* Middle column */}
        <div className="footer-col footer-nav-col">
          <h3>Obchod</h3>
          <ul>
            <li>
              <Link to="/about">O nás</Link>
            </li>
            <li>
              <Link to="/contact">Kontakt</Link>
            </li>
            <li>
              <Link to="/terms">Všeobecné obchodné podmienky</Link>
            </li>
            <li>
              <Link to="/partners">Partneri</Link>
            </li>
          </ul>
        </div>

        {/* Right column */}
        <div className="footer-col footer-nav-col">
          <h3>Dôležité informácie</h3>
          <ul>
            <li>
              <Link to="/privacy">Ochrana osobných údajov</Link>
            </li>
            <li>
              <Link to="/payments">Platby</Link>
            </li>
            {/* NEW: Cookie Preferences link */}
            <li>
              <a href="#" onClick={handleCookiePreferences}>
                Nastavenia cookies
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-main-line">
          <span>©2025 Nitracik.sk</span>
          <span>|</span>
          <span>All rights reserved</span>
        </div>
        <p className="footer-designer">Designed by Pluhi</p>
      </div>
    </footer>
  );
};

export default Foot;