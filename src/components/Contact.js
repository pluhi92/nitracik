import React, { useState } from "react";
import { useTranslation } from "../contexts/LanguageContext";
import '../styles/components/Contact.css';

function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setFormData({ name: "", email: "", message: "" }); // Reset form
      } else {
        setMessage(data.message || "Failed to send message.");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="contact">
      <div className="contact-container">
        <div className="contact-header">
          <h1 className="contact-title">{t?.contact?.title || 'Kontakt'}</h1>
          <p className="contact-subtitle">
            {t?.contact?.subtitle || 'Máte otázky? Radi vám pomôžeme a odpovieme.'}
          </p>
        </div>

        <div className="contact-content">
          <div className="contact-info-section">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-details">
                  <h3>{t?.contact?.phone || 'Telefón'}</h3>
                  <p>+421 949 584 576</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div className="contact-details">
                  <h3>{t?.contact?.address || 'Adresa'}</h3>
                  <p>Štefánikova trieda 148</p>
                  <p>949 01 Nitra</p>
                </div>
              </div>
              
              <div className="contact-item">
                <div className="contact-icon">✉️</div>
                <div className="contact-details">
                  <h3>{t?.contact?.email || 'Email'}</h3>
                  <p>info@nitracik.sk</p>
                </div>
              </div>
            </div>

             {/* Mapa sekcia */}
            <div className="map-section">
              <h3 className="map-title">Kde nás nájdete</h3>
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2638.456789012345!2d18.08643277680223!3d48.41323457138613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476b3d8a8c5c5c5d%3A0x8c5c5c5c5c5c5c5c!2zxaB0ZWbDoW5pa292YSB0cmllZGEgMTQ4LCA5NDkgMDEgTml0cmE!5e0!3m2!1sen!2ssk!4v1690000000000!5m2!1sen!2ssk"
                  width="100%"
                  height="300"
                  style={{ border: 0, borderRadius: '8px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Poloha Nitracik v Nitre - Štefánikova trieda"
                ></iframe>
              </div>
              <div className="map-actions">
                <a 
                  href="https://maps.google.com/?q=Štefánikova+trieda+148+Nitra" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="map-link"
                >
                  📍 Otvoriť v Google Maps
                </a>
              </div>
            </div>
          </div>

          <div className="contact-form-section">
            <form className="contact-form" onSubmit={handleSubmit}>
              <h3 className="form-title">{t?.contact?.form?.title || 'Napíšte nám'}</h3>
              
              <div className="form-group">
                <label htmlFor="name">{t?.contact?.form?.name || 'Meno a priezvisko *'}</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder={t?.contact?.form?.namePlaceholder || 'Vaše meno a priezvisko'}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">{t?.contact?.form?.email || 'Emailová adresa *'}</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder={t?.contact?.form?.emailPlaceholder || 'Váš email'}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">{t?.contact?.form?.message || 'Správa *'}</label>
                <textarea
                  id="message"
                  name="message"
                  placeholder={t?.contact?.form?.messagePlaceholder || 'Vaša správa...'}
                  rows="6"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading 
                  ? (t?.contact?.form?.sending || 'Odosielam...') 
                  : (t?.contact?.form?.submit || 'Odoslať správu')}
              </button>
              
              {message && (
                <p className={`form-message ${message.includes('successfully') ? 'success' : 'error'}`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;