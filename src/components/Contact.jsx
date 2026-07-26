import React, { useState } from "react";
import { useTranslation } from "../contexts/LanguageContext";
import api from '../api/api';
import { motion } from 'framer-motion';
import { Phone, MapPin, Mail, Send, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import mascotImage from '../assets/logo_bez.PNG';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    agreementChecked: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/api/contact", formData);
      setMessage(response.data.message);
      setFormData({ name: "", email: "", message: "", agreementChecked: false });
    } catch (error) {
      const errorMessage = error.response?.data?.message || t?.contact?.form?.errorGeneric || "An error occurred. Please try again.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="min-h-screen py-12 md:py-16"
    >
      <div className="container-custom max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
            {t?.contact?.title || 'Kontakt'}
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            {t?.contact?.subtitle || 'Máte otázky? Radi vám pomôžeme a odpovieme.'}
          </p>
        </div>

        {/* Main Card Container */}
        <div className="relative bg-white border border-neutral-200 rounded-[2rem] shadow-sm p-6 sm:p-10 md:p-12 w-full">
          {/* Mascot */}
          <img
            src={mascotImage}
            alt=""
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 sm:w-24 z-20 pointer-events-none"
            style={{ filter: 'drop-shadow(2px 4px 12px rgba(0,0,0,0.12))' }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">

            {/* Left Column - Contact Info & Map */}
            <div className="space-y-8">
              {/* Contact Info */}
              <div className="space-y-6">
                <h3 className="text-2xl font-extrabold text-foreground mb-6">
                  Kontaktné informácie
                </h3>

                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground mb-1">
                      {t?.contact?.phone || 'Telefón'}
                    </h4>
                    <p className="text-neutral-600 text-base font-medium">+421 949 584 576</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground mb-1">
                      {t?.contact?.address || 'Adresa'}
                    </h4>
                    <p className="text-neutral-600 text-base font-medium">Štefánikova trieda 148</p>
                    <p className="text-neutral-600 text-base font-medium">949 01 Nitra</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground mb-1">
                      {t?.contact?.email || 'Email'}
                    </h4>
                    <p className="text-neutral-600 text-base font-medium">info@nitracik.sk</p>
                  </div>
                </div>
              </div>

              {/* Map Section */}
              <div className="pt-8 border-t border-neutral-100">
                <h4 className="text-xl font-extrabold text-foreground mb-6">
                  Kde nás nájdete
                </h4>
                <div className="rounded-2xl overflow-hidden shadow-sm border border-neutral-200 mb-4">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2638.456789012345!2d18.08643277680223!3d48.41323457138613!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476b3d8a8c5c5c5d%3A0x8c5c5c5c5c5c5c5c!2zxaB0ZWbDoW5pa292YSB0cmllZGEgMTQ4LCA5NDkgMDEgTml0cmE!5e0!3m2!1sen!2ssk!4v1690000000000!5m2!1sen!2ssk"
                    width="100%"
                    height="200"
                    className="border-0"
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Poloha Nitracik v Nitre - Štefánikova trieda"
                  />
                </div>
                <div className="text-center">
                  <a
                    href="https://maps.google.com/?q=Štefánikova+trieda+148+Nitra"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-neutral-200 text-foreground font-bold rounded-full hover:bg-neutral-50 transition-all shadow-sm text-sm"
                  >
                    <MapPin className="w-4 h-4 text-primary" /> Otvoriť v Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="lg:border-l lg:border-neutral-100 lg:pl-12 pt-8 lg:pt-0 border-t border-neutral-100 lg:border-t-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-2xl font-extrabold text-foreground mb-8">
                  {t?.contact?.form?.title || 'Napíšte nám'}
                </h3>

                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-neutral-700 mb-2">
                    {t?.contact?.form?.name || 'Meno a priezvisko *'}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder={t?.contact?.form?.namePlaceholder || 'Vaše meno a priezvisko'}
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-neutral-700 mb-2">
                    {t?.contact?.form?.email || 'Emailová adresa *'}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder={t?.contact?.form?.emailPlaceholder || 'Váš email'}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm font-medium"
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-bold text-neutral-700 mb-2">
                    {t?.contact?.form?.message || 'Správa *'}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder={t?.contact?.form?.messagePlaceholder || 'Vaša správa...'}
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-y min-h-[120px] text-sm font-medium"
                  />
                </div>

                {/* Agreement Checkbox */}
                <div className="flex items-start gap-3 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-200/60">
                  <input
                    type="checkbox"
                    id="agreementChecked"
                    name="agreementChecked"
                    checked={formData.agreementChecked}
                    onChange={handleChange}
                    required
                    className="mt-1 w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary flex-shrink-0 cursor-pointer"
                  />

                  <label
                    htmlFor="agreementChecked"
                    className="text-xs sm:text-sm text-neutral-600 leading-relaxed cursor-pointer font-medium"
                  >
                    Vyhlasujem, že mi bola poskytnutá{' '}
                    <a
                      href="/gdpr/contact-form"
                      className="text-primary hover:underline font-bold"
                    >
                      Informácia o spracúvaní osobných údajov
                    </a>
                    .
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`w-full py-4 px-6 bg-primary text-white font-bold rounded-full transition-all shadow-sm text-sm sm:text-base flex items-center justify-center gap-2 ${
                    isLoading
                      ? 'bg-neutral-400 cursor-wait'
                      : 'hover:bg-primary-600 hover:-translate-y-0.5'
                  } disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:transform-none`}
                  disabled={isLoading || !formData.agreementChecked}
                >
                  {isLoading ? (
                    <span>{t?.contact?.form?.sending || 'Odosielam...'}</span>
                  ) : (
                    <>
                      <span>{t?.contact?.form?.submit || 'Odoslať správu'}</span>
                      <Send className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                {/* Message Display */}
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl text-center font-bold text-sm sm:text-base flex items-center justify-center gap-2 ${
                      message.includes('úspešne') || message.includes('successfully')
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {message.includes('úspešne') || message.includes('successfully') ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    <span>{message}</span>
                  </motion.div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default Contact;