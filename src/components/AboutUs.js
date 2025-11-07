import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import '../styles/components/AboutUs.css';

const AboutUs = () => {
  const { t } = useTranslation();

  return (
    <section className="about-us">
      <div className="container">
        <h2 className="about-us-title">{t?.about?.title || 'About Us'}</h2>
        <p className="about-us-description">
          {t?.about?.description || 'Welcome to Nitracik! We specialize in professional training sessions tailored to your needs. Join us to grow your skills and achieve your goals.'}
        </p>
      </div>
    </section>
  );
};

export default AboutUs;