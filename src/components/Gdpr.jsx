import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Gdpr = () => {
  const location = useLocation();
  // Prejdenie na vrch stránky pri načítaní
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, [location]);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center border-b pb-4">
          OCHRANA OSOBNÝCH ÚDAJOV
        </h1>

        {/* Pridaná trieda 'text-justify' pre zarovnanie textu */}
        <div className="space-y-8 text-gray-700 leading-relaxed text-justify">
          
          {/* Úvodné ustanovenia */}
          <section>
            <p className="mb-2">
              Spracúvanie osobných údajov dotknutých osôb sa riadi Nariadením Európskeho parlamentu a Rady (EÚ) 2016/679 z 27. apríla 2016 o ochrane fyzických osôb pri spracúvaní osobných údajov a o voľnom pohybe takýchto údajov, ktorým sa zrušuje smernica 95/46/ES (všeobecné nariadenie o ochrane údajov) (ďalej len „Nariadenie“).
            </p>
            <p className="mb-2">
              <strong>Nitráčik o.z.</strong>, so sídlom na Hydinárska 13A Nitra 94901 IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205 plne rešpektuje ochranu Vášho súkromia a váži si dôveru, ktorú nám pri spracúvaní osobných údajov zverujete.
            </p>
            <p className="mb-2">
              Na ochranu spracúvaných osobných údajov sme zaviedli všetky primerané bezpečnostné opatrenia technického, organizačného a iného charakteru a procesy na kontrolu ich priebežného dodržiavania a dostatočnosti.
            </p>
            <p>
              V tejto sekcii sa dozviete, ako nakladáme s Vašimi osobnými údajmi a aké sú Vaše práva v zmysle Nariadenia.
            </p>
          </section>

          {/* 1. Základné pojmy */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Základné pojmy</h2>
            <p className="mb-2">
              Prevádzkovateľ je presvedčený, že jasné informácie prispievajú k lepšiemu porozumeniu pravidiel spracúvania osobných údajov, preto v nasledujúcej časti uvádza najdôležitejšie pojmy používané v súvislosti s ochranou osobných údajov.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-justify">
              <li>
                <strong>Osobné údaje:</strong> sú akékoľvek informácie týkajúce sa identifikovanej alebo identifikovateľnej fyzickej osoby; identifikovateľná fyzická osoba je osoba, ktorú možno identifikovať priamo alebo nepriamo, najmä odkazom na identifikátor, ako je meno, identifikačné číslo, lokalizačné údaje, online identifikátor, alebo odkazom na jeden či viaceré prvky, ktoré sú špecifické pre fyzickú, fyziologickú, genetickú, mentálnu, ekonomickú, kultúrnu alebo sociálnu identitu tejto fyzickej osoby.
              </li>
              <li>
                <strong>Dotknutá osoba:</strong> je identifikovaná alebo identifikovateľná fyzická osoba, ktorej sa osobné údaje týkajú. Za dotknutú osobu sa považujú všetci návštevníci webovej stránky, registrované osoby a podobne.
              </li>
              <li>
                <strong>Prevádzkovateľ:</strong> je Nitráčik o.z., so sídlom na Hydinárska 167/13A Nitra 94901 IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205, ktorá určuje podmienky spracúvania osobných údajov a zodpovedá za spracúvanie osobných údajov.
              </li>
              <li>
                <strong>Sprostredkovateľ:</strong> znamená subjekt, ktorý spracúva osobné údaje v mene prevádzkovateľa. Prevádzkovateľ môže poveriť sprostredkovateľa spracúvaním osobných údajov bez súhlasu dotknutej osoby, musí sa však presvedčiť o tom, že sprostredkovateľ poskytuje dostatočné záruky na zabezpečenie súladu spracúvania osobných údajov s GDPR.
              </li>
              <li>
                <strong>Spracúvanie:</strong> predstavuje operácie/činnosti vykonávané s osobnými údajmi, napríklad získavanie, zaznamenávanie, usporadúvanie, štruktúrovanie, uchovávanie, prepracúvanie alebo zmena, vyhľadávanie, prehliadanie, využívanie, poskytovanie prenosom, šírením alebo poskytovanie iným spôsobom, preskupovanie alebo kombinovanie, obmedzenie, vymazanie alebo likvidácia, pričom nezáleží na tom, či sa vykonávajú automatizovane alebo manuálne.
              </li>
            </ul>
          </section>

          {/* 2. Prevádzkovateľ - Upravené podľa zadania */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Prevádzkovateľ</h2>
            <p className="mb-2">
              Prevádzkovateľom Nitráčik o.z., so sídlom na Hydinárska 167/13A Nitra 94901 IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205 (ďalej len “prevádzkovateľ”).
            </p>
          </section>

          {/* 3. Zodpovednosť za spracúvanie - Upravené podľa zadania */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Zodpovednosť za spracúvanie osobných údajov</h2>
            <p className="mb-2">
              Prevádzkovateľa v súvislosti so spracúvaním osobných údajov môžete v prípade akýchkoľvek otázok alebo požiadaviek ohľadom spracúvania osobných údajov kontaktovať na adrese sídla prevádzkovateľa: Hydinárska 167/13A Nitra 94901, alebo na emailovej adrese: <a href="mailto:gdpr@nitracik.sk" className="text-blue-600 hover:underline">gdpr@nitracik.sk</a>
            </p>
          </section>

          {/* 4. Výkon práv */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Výkon práv dotknutých osôb</h2>
            <p className="mb-2">
              V tejto sekcii sa dozviete, akým spôsobom môže dotknutá osoba uplatniť svoje právo a aký je postup prevádzkovateľa pri napĺňaní práv dotknutej osoby.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-justify">
              <li>
                <a
                  href="/documents/Gdpr/ver01_2026_Činnosť pri výkone práv dotknutých osôb.pdf"
                  className="text-blue-600 hover:underline"
                  download
                >
                  Činnosť pri napĺňaní práv dotknutej osoby
                  <img
                    src="/images/pdf.png"
                    alt="PDF"
                    className="ml-2 inline-block h-4 w-4 align-text-bottom"
                  />
                </a>
              </li>
              <li>
                <a
                  href="/documents/Gdpr/ver01_2026_Práva dotknutých osôb.pdf"
                  className="text-blue-600 hover:underline"
                  download
                >
                  Práva dotknutých osôb
                  <img
                    src="/images/pdf.png"
                    alt="PDF"
                    className="ml-2 inline-block h-4 w-4 align-text-bottom"
                  />
                </a>
              </li>
              <li>
                <a
                  href="/documents/Gdpr/ver01_2026_Žiadosť na výkon práva dotknutej osoby.pdf"
                  className="text-blue-600 hover:underline"
                  download
                >
                  Formulár na uplatnenie si práva dotknutej osoby
                  <img
                    src="/images/pdf.png"
                    alt="PDF"
                    className="ml-2 inline-block h-4 w-4 align-text-bottom"
                  />
                </a>
              </li>
            </ul>
          </section>

          {/* 5. Informačné povinnosti */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Informačné povinnosti</h2>
            <p className="mb-2">
              V tejto sekcii sa okrem iného dozviete, na aký účel, na základe akého právneho základu, ako dlho a prostredníctvom ktorých príjemcov spracúvame Vaše osobné údaje.
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-justify">
              <li>
                <Link to="/gdpr/registration" className="text-blue-600 hover:underline">
                  Informácia o spracúvaní osobných údajov – registrácia
                </Link>
              </li>
              <li>
                <Link to="/gdpr/cookies" className="text-blue-600 hover:underline">
                  Informácia o spracúvaní osobných údajov – cookies
                </Link>
              </li>
              <li>
                <Link to="/gdpr/contact-form" className="text-blue-600 hover:underline">
                  Informácia o spracúvaní osobných údajov – kontaktný formulár
                </Link>
              </li>
              <li>
                <Link to="/gdpr/social-networks" className="text-blue-600 hover:underline">
                  Informácia o spracúvaní osobných údajov – sociálne siete
                </Link>
              </li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Gdpr;