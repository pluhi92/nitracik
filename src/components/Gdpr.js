import React from 'react';

const Gdpr = () => {
  // Funkcia prebratá z Foot.js pre zachovanie identity správania
  const handleCookiePreferences = (e) => {
    e.preventDefault();
    if (window.openCookieSettings) {
      window.openCookieSettings();
    } else {
      // Záložné riešenie, ak by globálna funkcia zlyhala
      localStorage.removeItem('cookieConsent');
      window.location.reload();
    }
  };

  return (
    <section className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          
          {/* Header */}
          <div className="bg-secondary-500 p-8 text-black">
            <h1 className="text-3xl font-bold mb-2 text-black">Ochrana osobných údajov</h1>
            <p className="opacity-90 italic text-sm">V súlade s Nariadením EP a Rady (EÚ) 2016/679 (GDPR)</p>
          </div>

          <div className="p-8 space-y-10 text-gray-700 leading-relaxed">
            
            {/* 1. Prevádzkovateľ */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-1 h-8 bg-secondary-500 mr-4 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">1. Prevádzkovateľ údajov</h2>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 grid md:grid-cols-2 gap-y-6 gap-x-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Názov subjektu</p>
                  <p className="text-base font-semibold text-gray-800">OZ Nitráčik</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">IČO</p>
                  <p className="text-base font-semibold text-gray-800">56374453</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Sídlo</p>
                  <p className="text-base font-semibold text-gray-800">Považská 1137/10, 949 11 Nitra</p>
                </div>
                <hr className="md:col-span-2 border-gray-200" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Právna forma</p>
                  <p className="text-sm font-medium">Združenie (zväz, spolok)</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Druh vlastníctva</p>
                  <p className="text-sm font-medium">Združ., p. strany, cirkvi</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Dátum vzniku</p>
                  <p className="text-sm font-medium">26. augusta 2024</p>
                </div>
              </div>
            </section>

            {/* 2. Zabezpečenie údajov */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-1 h-8 bg-secondary-500 mr-4 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">2. Zabezpečenie a integrita údajov</h2>
              </div>
              <p className="mb-3 text-sm">
                Bezpečnosť vašich údajov je pre nás prioritou. Implementujeme technické a organizačné opatrenia v súlade s modernými štandardmi:
              </p>
              <ul className="list-disc ml-6 space-y-2 text-sm text-gray-600">
                <li><strong>Šifrovaný prenos (SSL/TLS):</strong> Celá komunikácia medzi vaším zariadením a našimi servermi je chránená šifrovaním HTTPS.</li>
                <li><strong>Ochrana pred útokmi:</strong> Monitorujeme prístupy a využívame moderné brány (firewally) na zamedzenie neoprávneného prístupu.</li>
                <li><strong>Poverené osoby:</strong> K osobným údajom majú prístup len administrátori OZ Nitráčik viazaní mlčanlivosťou.</li>
              </ul>
            </section>

            {/* 3. Cookies - TU JE OPRAVENÝ LINK */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-1 h-8 bg-secondary-500 mr-4 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">3. Cookies a sieťové identifikátory</h2>
              </div>
              <p className="text-sm mb-3">
                Pri používaní webovej stránky spracúvame sieťové identifikátory (IP adresy) a súbory cookies za účelom technického fungovania a analýzy návštevnosti.
              </p>
              
              <div className="mt-4 p-5 bg-secondary-800 rounded-xl border border-primary-100 shadow-sm">
                <p className="text-sm text-black font-medium mb-2">
                  Chcete zmeniť svoje nastavenia cookies?
                </p>
                <p className="text-xs text-black mb-3">
                  Môžete tak urobiť kedykoľvek kliknutím na tlačidlo nižšie, čím vyvoláte ponuku preferencií.
                </p>
                <button
                  onClick={handleCookiePreferences}
                  className="inline-flex items-center px-4 py-2 bg-white border border-primary-200 text-blakc rounded-lg text-sm font-bold hover:bg-primary-100 transition-colors shadow-sm"
                >
                  Otvoriť nastavenia cookies
                </button>
              </div>
            </section>

            {/* 4. Rozsah spracúvania */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-1 h-8 bg-secondary-500 mr-4 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-900">4. Účel a rozsah spracúvania</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-widest">
                      <th className="p-3 border-b border-gray-200">Účel</th>
                      <th className="p-3 border-b border-gray-200">Kategória údajov</th>
                      <th className="p-3 border-b border-gray-200">Právny základ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 border-b border-gray-100 font-medium italic">Rezervácie a permanentky</td>
                      <td className="p-3 border-b border-gray-100 text-gray-600">Meno, email, mobil, adresa, vek dieťaťa</td>
                      <td className="p-3 border-b border-gray-100">Plnenie zmluvy</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 border-b border-gray-100 font-medium italic">Platby (Stripe)</td>
                      <td className="p-3 border-b border-gray-100 text-gray-600">ID transakcie, stav úhrady</td>
                      <td className="p-3 border-b border-gray-100">Zákonná povinnosť</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 border-b border-gray-100 font-bold text-black">Propagácia OZ</td>
                      <td className="p-3 border-b border-gray-100 font-bold text-black">Fotografie a videá z aktivít</td>
                      <td className="p-3 border-b border-gray-100 font-bold text-black">Dobrovoľný súhlas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 5. Vaše práva */}
            <section className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 italic">Vaše práva ako dotknutej osoby</h2>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-bold text-gray-800">Právo na výmaz</p>
                  <p className="text-gray-600 italic">Môžete požiadať o vymazanie údajov (právo na zabudnutie).</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800">Právo na prenosnosť</p>
                  <p className="text-gray-600 italic">Máte právo získať export svojich údajov v strojovo čitateľnom formáte.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800">Odvolanie súhlasu</p>
                  <p className="text-gray-600 italic">Súhlas so spracovaním fotografií môžete kedykoľvek bez udania dôvodu odvolať.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800">Právo na opravu</p>
                  <p className="text-gray-600 italic">Údaje si môžete sami upraviť v profile alebo nás kontaktovať.</p>
                </div>
              </div>
            </section>

          </div>

          {/* Footer of the document */}
          <div className="bg-gray-100 p-8 text-center">
            <p className="text-sm text-gray-600 mb-2 font-medium">Máte otázky k vašim údajom? Kontaktujte nás:</p>
            <p className="text-lg font-bold text-black underline">oznitracik@gmail.com</p>
            <p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest">
              Posledná aktualizácia: 5. január 2026
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gdpr;