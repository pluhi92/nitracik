import React, { useState } from "react";
import { useTranslation } from "../contexts/LanguageContext";
import api from '../api/api';
import { Phone, MapPin, Mail, Send, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import mascotImage from '../assets/logo_bez.PNG';

const FlakPink = ({ className, style }) => (
  <svg viewBox="0 0 170.079 170.658" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,102.0004,33.3618)" fill="#F4A5A5" d="M0 0C-.049 .001-.084 .006-.122 .01-.182 .023-.241 .037-.301 .049-.28 .054-.187 .045 0 0M19.592-55.855C20.281-56.109 20.126-56.34 19.592-55.855M59.411-29.461C57.428-26.123 53.616-24.284 50.208-22.771 45.813-20.82 41.283-19.202 36.756-17.587 34.934-16.937 33.322-16.418 31.946-15.898 33.149-13.263 34.563-10.35 35.803-7.743 38.635-1.79 44.262 6.585 43.568 13.498L43.497 13.469C43.477 15.353 42.864 17.163 41.371 18.802 37.474 23.079 28.987 20.373 28.555 14.604 28.445 14.402 28.336 14.198 28.223 14.009 27.353 12.55 26.389 11.142 25.433 9.738 23.773 7.298 22.062 4.894 20.341 2.496 17.561 3.718 13.969 3.659 11.099 3.032 9.233 2.625 7.411 2.02 5.587 1.448 4.969 4.959 2.515 8.404-1.587 7.855-4.99 7.4-8.385 6.912-11.775 6.385-12.271 11.193-13.235 15.956-14.62 20.562-16.34 26.288-22.863 27.479-27.155 23.872-29.653 21.772-31.991 19.435-34.568 17.453-34.618 17.567-34.663 17.681-34.714 17.794-38.307 25.869-50.188 19.92-48.422 12.015-47.755 9.033-46.907 6.076-45.887 3.176-46.502 3.008-47.126 2.762-47.758 2.406-57.967-3.36-68.755-7.401-80.21-9.896-84.776-10.891-86.216-14.818-85.362-18.369-86.023-18.416-86.685-18.451-87.347-18.501-96.907-19.233-97.085-33.067-87.347-33.501-81.613-33.757-75.879-34.013-70.144-34.269-70.426-35.257-70.513-36.288-70.372-37.299-71.676-36.835-73.11-36.745-74.61-37.174-77.526-38.008-80.49-41.163-80.116-44.406-79.648-48.474-77.55-52.006-74.602-54.375-73.368-56.077-72.13-57.775-70.894-59.475-73.925-59.862-76.894-62.027-77.429-64.966-77.515-65.437-77.579-65.903-77.632-66.367-77.665-66.302-77.709-66.233-77.74-66.169-77.842-65.96-78.057-65.256-78.171-64.792-78.171-64.779-78.171-64.766-78.17-64.753-78.013-65.121-77.933-63.415-78.146-64.399-76.112-55.002-90.455-50.97-92.61-60.411-94.585-69.06-90.861-78.252-87.146-85.912-83.522-93.383-78.368-102.026-71.043-106.413-70.899-106.499-70.752-106.575-70.607-106.655-71.385-107.292-72.087-107.977-72.681-108.716-75.51-112.236-75.857-118.087-71.163-120.496-66.359-122.962-59.616-121.749-53.963-118.957-52.734-120.363-51.239-121.576-49.448-122.532-45.554-124.61-40.944-124.631-36.98-122.994-32.924-124.98-28.867-126.966-24.81-128.953-21.445-130.6-16.346-130.152-14.549-126.262-12.801-122.479-12.278-118.361-12.835-114.457-12.433-114.495-12.031-114.533-11.629-114.57-7.965-114.914-4.666-111.455-4.263-108.067-4.142-107.049-4.209-106.096-4.432-105.218-3.22-104.77-2.05-104.177-.94-103.467 1.423-105.279 3.805-107.066 6.221-108.806 12.385-113.244 19.072-118.602 26.383-121.019 31.118-122.584 36.677-121.152 38.264-115.886 39.425-112.034 37.477-108.294 35.327-105.21 31.237-99.345 26.243-94.192 21.555-88.821 21.454-88.705 21.354-88.587 21.253-88.471 25.425-87.677 28.671-85.208 31.348-81.712 33.784-78.532 31.874-73.606 28.881-71.604 29.147-71.392 29.404-71.181 29.645-70.975 34.107-67.15 37.25-61.703 36.609-55.69 35.893-48.969 30.618-45.112 25.644-41.229 34.669-43.988 45.652-46.496 54.535-42.159 59.491-39.739 62.499-34.66 59.411-29.461" />
  </svg>
);

const FlakCream = ({ className, style }) => (
  <svg viewBox="0 0 170.079 186.77" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,48.2144,165.57071)" fill="#EFE4C8" d="M0 0C-.168-.194-.238-.269 0 0M-26.05 53.518C-26.131 53.517-26.214 53.524-26.295 53.521-26.528 53.513-26.826 53.628-27.052 53.58-26.742 53.646-26.402 53.614-26.05 53.518M-21.47 47.527C-21.498 47.541-21.521 47.552-21.534 47.559-21.638 47.617-21.705 47.635-21.758 47.641-21.758 47.645-21.757 47.646-21.757 47.65-21.734 48.081-21.613 47.898-21.47 47.527M110.15 62.303C107.116 63.184 104.727 64.781 102.823 66.842 103.529 68.373 103.864 69.987 103.89 71.627 107.735 73.614 110.494 77.248 110.025 82.154 109.638 86.21 106.903 89.629 102.525 89.654 100.286 89.667 98.047 89.68 95.808 89.693 95.791 89.776 95.772 89.859 95.755 89.942 96.096 90.51 96.433 91.081 96.746 91.661 102.128 101.644 101.602 115.764 91.484 122.235 87.426 127.948 80.504 130.605 73.631 130.344 71.238 131.943 68.231 132.319 65.794 131.33 65.44 132.156 65.044 132.975 64.57 133.777 62.624 137.073 59.423 137.949 56.571 137.17 53.53 142.418 50.094 147.541 46.219 152.177 44.129 154.678 41.587 157.301 38.336 158.187 33.582 159.483 29.055 156.611 27.626 152.049 25.506 145.277 27.868 136.599 29.08 129.88 29.306 128.625 29.59 127.328 29.898 126.01 29.882 125.982 29.865 125.955 29.849 125.928 28.135 124.055 26.418 122.185 24.71 120.308 23.918 119.437 22.939 118.469 21.906 117.431 21.381 117.615 20.844 117.777 20.293 117.908 16.407 124.779 12.204 132.099 11.117 139.561 10.307 145.122 2.057 146.775-1.419 142.871-7.775 135.73-6.737 125.805-4.314 117.219-4.223 116.895-4.111 116.574-4.015 116.251-7.819 115.72-11.541 114.236-14.5 111.961-21.762 114.214-29.373 114.816-36.422 113.282-43.959 111.641-43.148 100.885-36.422 98.818-29.578 96.714-23.759 92.901-18.416 88.34-20.759 88.357-23.047 87.64-24.772 85.878-28.055 82.525-27.219 78.105-25.606 74.209-22.098 65.735-14.95 59.381-7.67 54.053-10.925 53.889-14.181 53.732-17.439 53.612-19.622 53.532-21.81 53.451-23.995 53.466-24.472 53.469-24.953 53.493-25.433 53.509-29.306 54.641-34.412 52.786-35.444 48.477-37.939 38.061-28.156 33.128-19.643 31.287-12.564 29.757-5.314 29.111 1.923 28.51 .46 22.217-.966 15.912-2.183 9.568-3.345 3.505-4.649-2.693-3.781-8.86-3.037-14.148 3.398-15.053 7.236-13.342 12.229-11.117 15.582-4.028 18.151 .638 18.69-.342 19.373-1.294 20.226-2.201 25.939-8.272 35.783-8.166 42.419-3.696 46.618-.867 48.926 3.22 50.119 7.756 57.704 3.858 66.779 2.626 74.906 4.709 80.686 6.19 88.654 10.306 92.058 15.338 97.075 22.757 91.471 28.464 84.373 30.439 84.335 30.449 84.258 30.473 84.159 30.504 85.116 32.223 85.851 34.067 86.308 35.971 87.099 39.259 87.17 43.268 86.072 46.52 86.044 46.603 86.006 46.683 85.976 46.765 86.932 46.624 87.894 46.427 88.868 46.138 91.649 45.314 94.118 46.242 95.839 47.967 97.975 47.722 99.924 48.397 101.384 49.651 102.872 48.948 104.456 48.334 106.162 47.839 115.451 45.143 119.417 59.614 110.15 62.303" />
  </svg>
);

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
    <div className="relative w-full bg-white">
    <section className="min-h-screen py-12 md:py-16">
      <div className="container-custom max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20 md:mb-24">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-4">
            {t?.contact?.title || 'Kontakt'}
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            {t?.contact?.subtitle || 'Máte otázky? Radi vám pomôžeme a odpovieme.'}
          </p>
        </div>

        {/* Main Card Container */}
        <div className="relative">
          {/* Mascot */}
          <img
            src={mascotImage}
            alt=""
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 sm:w-24 z-20 pointer-events-none"
            style={{ filter: 'drop-shadow(2px 4px 12px rgba(0,0,0,0.12))' }}
          />
          <div className="relative bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md p-6 sm:p-10 md:p-12 w-full overflow-hidden" style={{ isolation: 'isolate' }}>
            <FlakPink className="absolute pointer-events-none" style={{ width: 195, top: 10, left: -22, opacity: 0.32, zIndex: -1, transform: 'rotate(-15deg)' }} />
            <FlakCream className="absolute pointer-events-none" style={{ width: 180, bottom: 10, right: -18, opacity: 0.30, zIndex: -1, transform: 'rotate(25deg)' }} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">

            {/* Left Column - Contact Info & Map */}
            <div className="space-y-8">
              {/* Contact Info */}
              <div className="space-y-6">
                <h3 className="text-2xl font-extrabold text-foreground mb-6 text-center lg:!text-left">
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
                    <a
                      href="tel:+421949584576"
                      className="text-neutral-600 text-base font-medium hover:text-primary transition-colors"
                    >
                      +421 949 584 576
                    </a>
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
                    <a
                      href="mailto:info@nitracik.sk"
                      className="text-neutral-600 text-base font-medium hover:text-primary transition-colors"
                    >
                      info@nitracik.sk
                    </a>
                  </div>
                </div>
              </div>

              {/* Map Section */}
              <div className="pt-8 border-t border-neutral-100">
                <h4 className="text-xl font-extrabold text-foreground mb-6 text-center lg:!text-left">
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
                <h3 className="text-2xl font-extrabold text-foreground mb-8 text-center lg:!text-left">
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
                  <div 
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
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
    </div>
  );
}

export default Contact;