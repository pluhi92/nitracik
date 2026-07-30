import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Modal } from "react-bootstrap";
import logo from "../assets/logo.png";
import stripeLogo from "../assets/stripe-logo_black.png";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { FaInstagram, FaFacebookF } from "react-icons/fa";

// Import vlastných ikon platobných metód
import visaLogo from "../assets/visa.png";
import mastercardLogo from "../assets/mastercard.png";
import applepayLogo from "../assets/applePay.png";
import googlepayLogo from "../assets/googlePay.png";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const Foot = () => {
  const [showPartnersModal, setShowPartnersModal] = useState(false);

  const currentYear = new Date().getFullYear();
  const foundedYear = 2025;

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
      description: "Montessori pomôcky s láskou",
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
    window.dispatchEvent(new Event('openCookieSettings'));
  };

  // Zdieľaný blok pre sociálne siete, Stripe a platobné karty, aby sa neopakoval duplicitne
  const SocialAndPaymentsContent = () => (
    <div className="w-full flex flex-col items-center mt-6 pt-4 border-t border-neutral-100">
      {/* Social Icons */}
      <div className="flex gap-3 justify-center mb-5">
        <a
          href="https://www.facebook.com/people/Nitr%C3%A1%C4%8Dik/61558994166250/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-primary hover:text-primary hover:bg-neutral-50 transition-all"
        >
          <FaFacebookF className="w-4 h-4" />
        </a>
        <a
          href="https://www.instagram.com/nitracik"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:border-primary hover:text-primary hover:bg-neutral-50 transition-all"
        >
          <FaInstagram className="w-4 h-4" />
        </a>
      </div>

      {/* Stripe & Cards */}
      <img src={stripeLogo} alt="Stripe" className="h-5 object-contain opacity-80 mb-3" />
      <div className="flex gap-2.5 flex-wrap justify-center items-center">
        <img src={visaLogo} alt="Visa" className="h-6 object-contain opacity-70 hover:opacity-100 transition-opacity" title="Visa" />
        <img src={mastercardLogo} alt="MasterCard" className="h-6 object-contain opacity-70 hover:opacity-100 transition-opacity" title="MasterCard" />
        <img src={applepayLogo} alt="Apple Pay" className="h-6 object-contain opacity-70 hover:opacity-100 transition-opacity" title="Apple Pay" />
        <img src={googlepayLogo} alt="Google Pay" className="h-6 object-contain opacity-70 hover:opacity-100 transition-opacity" title="Google Pay" />
      </div>
    </div>
  );

  return (
    <motion.footer 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      className="card-glass text-foreground pt-16 pb-6 px-6 font-sans text-sm border-t border-neutral-200 mt-auto"
    >
      {/* Main Content */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 items-start gap-12 mb-8">

        {/* Left Column - Brand */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="mb-4 inline-block" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img
              src={logo}
              alt="Nitracik Logo"
              className="w-40 object-contain transition-transform duration-300 hover:scale-105"
            />
          </Link>
          <p className="mb-2 text-neutral-600 font-medium text-sm">Tešíme sa na Vás! 🤍</p>
          <a
            href="tel:+421949584576"
            className="text-foreground font-bold mb-1 text-sm hover:text-primary transition-colors"
          >
            +421 949 584 576
          </a>
          <a
            href="mailto:info@nitracik.sk"
            className="text-neutral-600 mb-2 font-semibold text-sm hover:text-primary transition-colors"
          >
            info@nitracik.sk
          </a>
        </div>

        {/* Middle Column - Navigation */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h3 className="text-foreground mb-4 text-base font-extrabold uppercase tracking-wider">Obchod</h3>
          <ul className="flex flex-col gap-3 font-semibold">
            <li>
              <Link to="/about" className="text-neutral-600 hover:text-primary transition-colors text-sm">
                O nás
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-neutral-600 hover:text-primary transition-colors text-sm">
                Kontakt
              </Link>
            </li>
            <li>
              <Link to="/terms" className="text-neutral-600 hover:text-primary transition-colors text-sm">
                Všeobecné obchodné podmienky
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setShowPartnersModal(true)}
                className="text-neutral-600 hover:text-primary transition-colors text-sm bg-transparent border-0 p-0 cursor-pointer font-semibold"
              >
                Partneri
              </button>
            </li>
          </ul>

          {/* Zobrazené iba na desktope v strednom stĺpci */}
          <div className="hidden md:block w-full">
            <SocialAndPaymentsContent />
          </div>
        </div>

        {/* Right Column - Important Info */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h3 className="text-foreground mb-4 text-base font-extrabold uppercase tracking-wider">Dôležité informácie</h3>
          <ul className="flex flex-col gap-3 font-semibold mb-2">
            <li>
              <Link to="/gdpr" className="text-neutral-600 hover:text-primary transition-colors text-sm">
                Ochrana osobných údajov
              </Link>
            </li>
            <li>
              <Link to="/faq" className="text-neutral-600 hover:text-primary transition-colors text-sm">
                Často kladené otázky (FAQ)
              </Link>
            </li>
            <li>
              <Link to="/payments" className="text-neutral-600 hover:text-primary transition-colors text-sm">
                Platby
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={handleCookiePreferences}
                className="text-neutral-600 hover:text-primary transition-colors text-sm bg-transparent border-0 p-0 cursor-pointer font-semibold"
              >
                Nastavenia cookies
              </button>
            </li>
          </ul>
        </div>

        {/* Zobrazené iba na mobile pod všetkými stĺpcami */}
        <div className="md:hidden w-full col-span-1">
          <SocialAndPaymentsContent />
        </div>
        
      </div>

      {/* Bottom Section */}
      <div className="max-w-5xl mx-auto mt-2 pt-2 border-t border-neutral-100 text-center text-neutral-500 text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-2">
        <div className="flex gap-2 items-center justify-center flex-wrap">
          <span>
            © {foundedYear}{foundedYear === currentYear ? "" : `-${currentYear}`} Nitracik.sk. Všetky práva vyhradené.
          </span>
        </div>
        <p className="text-neutral-400 font-medium">Designed by Pluhi</p>
      </div>

      {/* Partners Modal */}
      <Modal
        show={showPartnersModal}
        onHide={() => setShowPartnersModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="border-neutral-100">
          <Modal.Title className="font-extrabold text-xl text-foreground">Naši Partneri</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="border border-neutral-200 rounded-2xl p-5 card-glass shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="mb-4 h-40 bg-neutral-50 rounded-xl overflow-hidden flex items-center justify-center p-3 border border-neutral-100">
                    <img
                      src={`/images/partners/${partner.image}`}
                      alt={partner.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>

                  <h3 className="text-base font-extrabold text-foreground mb-1">{partner.name}</h3>
                  <p className="text-xs text-neutral-500 font-semibold mb-3">{partner.description}</p>

                  <a
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs font-bold mb-4 inline-flex items-center gap-1 hover:underline"
                  >
                    {partner.url} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="bg-neutral-50 border border-neutral-200/60 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Zľavový kód</p>
                    <p className="text-sm font-extrabold text-primary">{partner.discount}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">
                    -10%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </motion.footer>
  );
};

export default Foot;