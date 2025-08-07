import React, { useState } from "react";
import { useTranslation } from "../contexts/LanguageContext";
import "./Contact.css";

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
        <h2 className="contact-title">{t?.contact?.title || 'Contact Us'}</h2>
        <div className="contact-info">
          <div className="contact-item">
            <h3>{t?.contact?.phone || 'Phone'}</h3>
            <p>+421 555 666</p>
          </div>
          <div className="contact-item">
            <h3>{t?.contact?.address || 'Address'}</h3>
            <p>Lehotská 209/2, Kynek, 949 01 Nitra</p>
          </div>
          <div className="contact-item">
            <h3>{t?.contact?.email || 'Email'}</h3>
            <p>info@nitracik.sk</p>
          </div>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t?.contact?.form?.name || 'Your Name'}</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder={t?.contact?.form?.namePlaceholder || 'Enter your name'}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">{t?.contact?.form?.email || 'Your Email'}</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder={t?.contact?.form?.emailPlaceholder || 'Enter your email'}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="message">{t?.contact?.form?.message || 'Your Message'}</label>
            <textarea
              id="message"
              name="message"
              placeholder={t?.contact?.form?.messagePlaceholder || 'Write your message here'}
              rows="4"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading 
              ? t?.contact?.form?.sending || 'Sending...' 
              : t?.contact?.form?.submit || 'Send Message'}
          </button>
          {message && <p className="form-message">{message}</p>}
        </form>
        <div className="map-container">
          <iframe
            src="https://maps.app.goo.gl/jzhcNyaVb2FBM2FV7"
            title="Google Maps Location"
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </section>
  );
}

export default Contact;