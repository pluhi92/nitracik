import React, { useState } from "react";
import { useTranslation } from "../contexts/LanguageContext";
import api from '../api/api';

function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    agreementChecked: false, // NOVÉ: Predvolená hodnota pre GDPR/VOP suhlas
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
      // NOVÉ: Použitie api.post namiesto fetch()
      // Axios automaticky použije baseURL, Content-Type a withCredentials
      const response = await api.post("/api/contact", formData);

      // Axios automaticky spracuje JSON a hádže chybu pre ne-2xx status
      setMessage(response.data.message);
      setFormData({ name: "", email: "", message: "", agreementChecked: false }); // Reset formulára

    } catch (error) {
      // Spracovanie chyby z Axios (vrátenej z backendu alebo sieťovej)
      const errorMessage = error.response?.data?.message || t?.contact?.form?.errorGeneric || "An error occurred. Please try again.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-background py-12"> {/* Zmenené: py-20 -> py-12 */}
      <div className="max-w-container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-6"> {/* Zmenené: mb-12 -> mb-6 */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {t?.contact?.title || 'Kontakt'}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t?.contact?.subtitle || 'Máte otázky? Radi vám pomôžeme a odpovieme.'}
          </p>
        </div>

        {/* Main Card Container */}
        <div className="bg-overlay-80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-gray-200 p-4 sm:p-6 md:p-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">

            {/* Left Column - Contact Info & Map */}
            <div className="space-y-6 md:space-y-8">
              {/* Contact Info */}
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">
                  Kontaktné informácie
                </h3>

                {/* Phone */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                    📞
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                      {t?.contact?.phone || 'Telefón'}
                    </h4>
                    <p className="text-gray-600 text-base sm:text-lg">+421 949 584 576</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                    📍
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                      {t?.contact?.address || 'Adresa'}
                    </h4>
                    <p className="text-gray-600 text-base sm:text-lg">Štefánikova trieda 148</p>
                    <p className="text-gray-600 text-base sm:text-lg">949 01 Nitra</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg flex items-center justify-center text-lg sm:text-xl flex-shrink-0">
                    ✉️
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                      {t?.contact?.email || 'Email'}
                    </h4>
                    <p className="text-gray-600 text-base sm:text-lg">info@nitracik.sk</p>
                  </div>
                </div>
              </div>

              {/* Map Section */}
              <div className="pt-6 md:pt-8 border-t border-gray-200">
                <h4 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 md:mb-6">
                  Kde nás nájdete
                </h4>
                <div className="rounded-lg overflow-hidden shadow-md mb-4">
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
                    className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg text-sm sm:text-base"
                  >
                    📍 Otvoriť v Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column - Contact Form */}
            <div className="border-l-0 lg:border-l lg:border-gray-200 lg:pl-8 xl:pl-12 pt-6 lg:pt-0 border-t border-gray-200 lg:border-t-0">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 sm:mb-8">
                  {t?.contact?.form?.title || 'Napíšte nám'}
                </h3>

                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-2">
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 text-sm sm:text-base"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-800 mb-2">
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 text-sm sm:text-base"
                  />
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-800 mb-2">
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 resize-y min-h-[100px] font-inherit text-sm sm:text-base"
                  />
                </div>

                {/* Agreement Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="agreementChecked"
                    name="agreementChecked"
                    checked={formData.agreementChecked}
                    onChange={handleChange}
                    required
                    className="mt-1 w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500 focus:ring-2 flex-shrink-0"
                  />

                  <label
                    htmlFor="agreementChecked"
                    className="text-xs sm:text-sm text-gray-700 leading-relaxed"
                  >
                    Vyhlasujem, že som sa oboznámil/a so{' '}
                    <a
                      href="/gdpr"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600 underline font-medium"
                    >
                      Zásadami ochrany osobných údajov
                    </a>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`w-full py-3 sm:py-4 px-4 sm:px-6 bg-primary-500 text-white font-semibold rounded-lg transition-all duration-300 text-sm sm:text-base ${isLoading
                    ? 'bg-gray-400 cursor-wait'
                    : 'hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg'
                    } disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none`}
                  disabled={isLoading || !formData.agreementChecked}
                >
                  {isLoading
                    ? (t?.contact?.form?.sending || 'Odosielam...')
                    : (t?.contact?.form?.submit || 'Odoslať správu')}
                </button>

                {/* Message Display */}
                {message && (
                  <div className={`p-3 sm:p-4 rounded-lg text-center font-medium text-sm sm:text-base ${message.includes('successfully')
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;