import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Modal } from "react-bootstrap";
import logo from "../assets/logo.png";
import stripeLogo from "../assets/stripe-logo_black.png";
import { FaInstagram, FaFacebookF } from "react-icons/fa";

// Import vlastných ikon platobných metód
import visaLogo from "../assets/visa.png";
import mastercardLogo from "../assets/mastercard.png";
import applepayLogo from "../assets/applePay.png";
import googlepayLogo from "../assets/googlePay.png";

const Foot = () => {
  const [showPartnersModal, setShowPartnersModal] = useState(false);

  const partners = [
    {
      name: "Raj pre deti",
      description: "SENZORICKÉ-MOTORICKÉ-EDUKAČNÉ-LOGICKÉ POMÔCKY",
      url: "https://www.rajpredetisro.sk/",
      discount: "Nitracik10",
      image: "raj_pre_deti.png"
    },
    {
      name: "Melian",
      description: "Montessiri pomôcky s láskou",
      url: "https://www.melian.sk",
      discount: "Nitracik10",
      image: "melian.png"
    },
    {
      name: "Hravé detičky",
      description: "Všetko pre vaše hravé detičky",
      url: "https://hravedeticky.sk/",
      discount: "Nitracik10",
      image: "hrave_deticky.png"
    },
    {
      name: "Cupilupi",
      description: "Senzomotorické koberčeky",
      url: "https://www.cupilupi.sk/",
      discount: "Nitracik10",
      image: "cupilupi.png"
    }
  ];

  const handleCookiePreferences = (e) => {
    e.preventDefault();
    // Odosielame udalosť 'openCookieSettings', ktorú CookieConsent počúva
    window.dispatchEvent(new Event('openCookieSettings'));
  };

  return (
    <footer className="bg-white text-secondary-500 py-7 px-8 pb-3 font-sans text-sm leading-relatives shadow-md">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 justify-items-center items-start gap-16">

        {/* Left Column - Brand */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <img
            src={logo}
            alt="Nitracik Logo"
            className="w-44 lg:w-50 mb-4 object-contain hover:scale-105 transition-transform duration-300"
          />
          <p className="mb-2 text-secondary-500 font-medium text-sm">Tešíme sa na Vás!</p>
          <span className="text-secondary-500 mb-3 block font-medium text-sm">+421 949 584 576</span>
          <a
            href="mailto:info@nitracik.sk"
            className="text-secondary-500 mb-4 block font-medium text-sm hover:text-secondary-600 hover:underline transition-all duration-300"
          >
            info@nitracik.sk
          </a>
          <div className="flex gap-3 mt-auto">
            <a
              href="https://www.facebook.com/people/Nitr%C3%A1%C4%8Dik/61558994166250/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF className="text-2xl text-secondary-500 hover:text-secondary-600 hover:scale-110 transition-all duration-300" />
            </a>
            <a
              href="https://www.instagram.com/nitracik"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram className="text-2xl text-secondary-500 hover:text-secondary-600 hover:scale-110 transition-all duration-300" />
            </a>
          </div>
        </div>

        {/* Middle Column - Navigation */}
        <div className="flex flex-col items-center text-center pt-2">
          <h3 className="text-gray-900 mb-4 text-sm font-semibold">Obchod</h3>
          <ul className="flex flex-col gap-2">
            <li>
              <Link to="/about" className="text-secondary-500 hover:text-secondary-600 transition-colors duration-300 text-sm">
                O nás
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-secondary-500 hover:text-secondary-600 transition-colors duration-300 text-sm">
                Kontakt
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-secondary-500 hover:text-secondary-600 transition-colors duration-300 text-sm">
                Všeobecné obchodné podmienky
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setShowPartnersModal(true)}
                className="text-secondary-500 hover:text-secondary-600 transition-colors duration-300 text-sm bg-transparent border-0 p-0 cursor-pointer"
              >
                Partneri
              </button>
            </li>
          </ul>
        </div>

        {/* Right Column - Important Info & Payments */}
        <div className="flex flex-col items-center text-center pt-2">
          <h3 className="text-gray-900 mb-4 text-sm font-semibold">Dôležité informácie</h3>
          <ul className="flex flex-col gap-2 mb-6">
            <li>
              <Link to="/gdpr" className="text-secondary-500 hover:text-secondary-600 transition-colors duration-300 text-sm">
                Ochrana osobných údajov
              </Link>
            </li>
            <li>
              <Link to="/faq" className="text-secondary-500 hover:text-secondary-600 transition-colors duration-300 text-sm">
                Často kladené otázky (FAQ)
              </Link>
            </li>
            <li>
              <Link to="/payments" className="text-secondary-500 hover:text-secondary-600 transition-colors duration-300 text-sm">
                Platby
              </Link>
            </li>
            <li>
              {/* ZMENA: <a> na <button> */}
              <button
                type="button"
                onClick={handleCookiePreferences}
                className="text-secondary-500 hover:text-secondary-600 transition-colors duration-300 text-sm bg-transparent border-0 p-0 cursor-pointer"
              >
                Nastavenia cookies
              </button>
            </li>
          </ul>

          {/* Payment Methods */}
          <div className="mt-6 pt-4 border-t border-gray-300 w-full">
            <div className="mb-3">
              <img
                src={stripeLogo}
                alt="Stripe"
                className="h-6 mx-auto mb-3 opacity-90"
              />
            </div>
            <div className="flex gap-3 flex-wrap justify-center items-center">
              <img
                src={visaLogo}
                alt="Visa"
                className="h-7 opacity-80 hover:opacity-100 hover:scale-105 hover:brightness-75 transition-all duration-300"
                title="Visa"
              />
              <img
                src={mastercardLogo}
                alt="MasterCard"
                className="h-7 opacity-80 hover:opacity-100 hover:scale-105 hover:brightness-75 transition-all duration-300"
                title="MasterCard"
              />
              <img
                src={applepayLogo}
                alt="Apple Pay"
                className="h-7 opacity-80 hover:opacity-100 hover:scale-105 hover:brightness-75 transition-all duration-300"
                title="Apple Pay"
              />
              <img
                src={googlepayLogo}
                alt="Google Pay"
                className="h-7 opacity-80 hover:opacity-100 hover:scale-105 hover:brightness-75 transition-all duration-300"
                title="Google Pay"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-6 pt-2 border-t border-gray-300 text-center text-secondary-500 text-xs flex flex-col items-center gap-1">
        <div className="flex gap-3 items-center justify-center flex-wrap">
          <span>©2025 Nitracik.sk</span>
          <span>|</span>
          <span>All rights reserved</span>
        </div>
        <p className="text-secondary-500 text-xs">Designed by Pluhi</p>
      </div>

      {/* Partners Modal */}
      <Modal
        show={showPartnersModal}
        onHide={() => setShowPartnersModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="border-b border-gray-200">
          <Modal.Title className="text-2xl font-bold text-gray-900">Naši Partneri</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow duration-300"
              >
              <div className="mb-4 h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={`/images/partners/${partner.image}`}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>

                {/* Partner Info */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">{partner.name}</h3>
                <p className="text-sm text-secondary-500 font-semibold mb-3">{partner.description}</p>

                {/* Website Link */}
                <a
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-3 block hover:underline"
                >
                  {partner.url}
                </a>

                {/* Discount Code */}
                <div className="bg-gray-100 border border-gray-300 rounded p-3">
                  <p className="text-xs text-gray-600 mb-1">Zľavový kód:</p>
                  <p className="text-sm font-bold text-secondary-900">{partner.discount}</p>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </footer>
  );
};

export default Foot;