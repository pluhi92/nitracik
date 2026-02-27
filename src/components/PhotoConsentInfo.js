import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const PhotoConsentInfo = () => {
  const location = useLocation();
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 sm:p-12">
        <Link to="/gdpr" className="inline-flex items-center text-blue-600 hover:underline mb-6">
          ← Späť na GDPR
        </Link>
        
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center border-b pb-4 uppercase">
          Súhlas so spracúvaním osobných údajov a s vyhotovením zvukového, obrazového, alebo zvukovo-obrazového záznamu na propagačné účely
        </h1>

        <div className="space-y-6 text-gray-700 leading-relaxed text-justify">

          {showScrollButton && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 border-2 border-gray-700 text-gray-700 hover:text-gray-900 hover:border-gray-900 hover:shadow-2xl rounded-full shadow-lg transition-all duration-300 z-50 bg-white/80 w-16 h-16 flex items-center justify-center"
              aria-label="Scroll to top"
            >
              <span className="text-3xl font-black leading-none translate-y-1">^</span>
            </button>
          )}

          <section>
            <p>
              Zakliknutím na checkbox v rámci Užívateľského konta na <a href="https://www.nitracik.sk" className="text-blue-600 hover:underline">www.nitracik.sk</a> udeľujeme v zmysle Nariadenia Európskeho parlamentu a Rady (EÚ) 2016/679 z 27. apríla 2016 o ochrane fyzických osôb pri spracúvaní osobných údajov a o voľnom pohybe takýchto údajov, ktorým sa zrušuje smernica 95/46/ES (ďalej len „Nariadenie“) týmto udeľujeme <strong>Občianske združenie Nitráčik o.z.</strong>, so sídlom na Hydinárska 13A Nitra 94901, IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205 (ďalej len „občianske združenie“ alebo „prevádzkovateľ“ alebo „Nitráčik o.z.,“) ako prevádzkovateľovi dobrovoľný a bezodplatný súhlas so spracúvaním osobných údajov nášho dieťaťa ako dotknutej osoby v nižšie uvedenom rozsahu na nižšie uvedený účel spracúvania, a to za nasledovných podmienok:
            </p>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Účel spracúvania osobných údajov dotknutej osoby:</h2>
              <p>Propagácia občianskeho združenia a jeho aktivít na oficiálnej webstránke www.nitracik.sk a jeho profiloch na sociálnych sieťach Facebook a Instagram a v priestoroch občianskeho združenia.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">Rozsah spracúvaných osobných údajov dotknutej osoby:</h2>
              <p>Meno, priezvisko, fotografia, zvukový, obrazový, zvukovo-obrazový záznam.</p>
            </div>

            <p>
              Osobné údaje sa spracúvajú o zákonných zástupcoch, informácii o tom kedy bol udelený súhlas a kedy bol odvolaný. Informácia o dôkaze o udelení súhlasu sa uchovávať 5 rokov odo dňa skončenia platnosti súhlasu, alebo odo dňa odvolania súhlasu.
            </p>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">Právny základ spracúvania osobných údajov:</h2>
              <p>Čl. 6 ods. 1 písm. a) Nariadenia - súhlas dotknutej osoby.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">Doba udelenia súhlasu:</h2>
              <p>Občianske združenie bude spracúvať osobné údaje:</p>
              <ol className="list-decimal pl-6 mt-1 space-y-1">
                <li>vyhotovovaním fotografií, zvukových, obrazových, zvukovo-obrazových záznamov po kým Vaše dieťa bude navštevovať podujatia organizované občianskym združením,</li>
                <li>fotografie budú zverejnené 5 rokov nasledujúcich po roku v ktorom boli vyhotovené.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Osobné údaje budú zverejnené:</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>V priestoroch občianskeho združenia,</li>
              <li>Na webovej stránke <a href="https://www.nitracik.sk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.nitracik.sk</a>,</li>
              <li>Na sociálnej sieti Facebook: <a href="https://www.facebook.com/people/Nitr%C3%A1%C4%8Dik/61558994166250/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">https://www.facebook.com/people/Nitráčik/61558994166250/</a>,</li>
              <li>Na sociálnej sieti Instagram: <a href="https://www.instagram.com/nitracik" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://www.instagram.com/nitracik</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Príjemcovia spracúvania osobných údajov:</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>subjekty, ktorým poskytnutie osobných údajov vyplýva prevádzkovateľovi zo zákona;</li>
              <li>odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti;</li>
              <li>spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby.</li>
            </ul>
          </section>

          <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Odvolanie súhlasu</h2>
            <p className="mb-2">Beriem na vedomie, že súhlas je možné odvolať zaslaním odvolania súhlasu buď:</p>
            <ul className="list-disc pl-6 mb-2 space-y-1">
              <li>(i) e-mailom na <a href="mailto:gdpr@nitracik.sk" className="text-blue-600 hover:underline">gdpr@nitracik.sk</a>;</li>
              <li>(ii) písomne na adresu sídla prevádzkovateľa;</li>
              <li>(iii) alebo osobne v sídle prevádzkovateľa.</li>
            </ul>
            <p>Odvolanie je potrebné označiť poznámkou <strong>“OSOBNÉ ÚDAJE“</strong>. Odvolanie súhlasu nebude mať vplyv na zákonnosť spracúvania osobných údajov uskutočnených pred jeho odvolaním.</p>
          </section>

          <section>
            <p>
              Beriem na vedomie, že spoločnosť nevyužíva spracúvané osobné údaje na účely automatizovaného rozhodovania, vrátane profilovania.
            </p>
            <p className="mt-2">
              V rámci spracúvania osobných údajov nedochádza k ich prenosu do tretích krajín mimo územia EHS. Prenos však môže vykonávať prevádzkovateľ nasledovných sociálnych sietí:
            </p>
            <ul className="list-disc pl-6 mt-1 space-y-1">
              <li>Facebook – viac o ochrane osobných údajov nájdete tu: <a href="https://www.facebook.com/privacy/policy/?locale=sk_SK" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ochrana súkromia Meta</a></li>
              <li>Instagram – viac o ochrane osobných údajov nájdete tu: <a href="https://help.instagram.com/581066165581870/?locale=sk_SK&hl=sk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ochrana súkromia Instagram</a></li>
            </ul>
          </section>

          <section>
            <p>
              Potvrdzujem, že som bol/a ako dotknutá osoba informovaný/á, že všetky aktuálne podmienky spracúvania osobných údajov sa nachádzajú na intranete spoločnosti v časti GDPR a v tlačenej forme v sídle spoločnosti, a že tieto som si pred udelením súhlasu riadne prečítal/a.
            </p>
            <p className="mt-2">
              Ako dotknutá osoba beriem pritom osobitne na vedomie, že mám právo na prístup k osobným údajom, na opravu, na výmaz, právo na obmedzenie spracúvania osobných údajov, právo na prenosnosť v prípade automatizovaného spracúvania ako aj právo obrátiť sa so sťažnosťou na Úrad na ochranu osobných údajov SR.
            </p>
          </section>

          <section className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Súhlas podľa Občianskeho zákonníka</h2>
            <p>
              Zároveň týmto ako dotknutá osoba udeľujem dobrovoľný bezodplatný súhlas prevádzkovateľovi, aby v súlade s ust. § 12 a nasl. zák. č. 40/1964 Zb. Občianskeho zákonníka SR, vyhotovoval, spracúval, použil, zverejnil a šíril fotografie, podobizne, zvukové, obrazové alebo zvukovo-obrazové záznamy a prejavy osobnej povahy nášho dieťaťa za vyššie uvedeným účelom, vo vyššie uvedenom rozsahu a dobe spracúvania.
            </p>
          </section>

          <section>
            <p>
              Podrobné informácie o jednotlivých právach dotknutých osôb a spôsobe ich uplatnenia sú uvedené na <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://nitracik.sk/</a> v časti Ochrana osobných údajov.
            </p>
            <p className="mt-2">
              Žiadosti v súvislosti s vyššie uvedenými právami je dotknutá osoba oprávnená uplatniť na adrese <a href="mailto:gdpr@nitracik.sk" className="text-blue-600 hover:underline">gdpr@nitracik.sk</a>, resp. formou doporučeného listu doručeného prevádzkovateľovi – jeho zodpovednej osobe, prípadne osobne v sídle prevádzkovateľa.
            </p>
            <p className="mt-2">
              Odpovede na uvedené žiadosti dotknutej osoby alebo opatrenia prijaté na základe týchto žiadostí sa poskytujú bezodplatne. Ak je žiadosť dotknutej osoby zjavne neopodstatnená alebo neprimeraná, najmä pre jej opakujúcu sa povahu (opakovaná žiadosť), prevádzkovateľ má právo účtovať si poplatok zohľadňujúci jej administratívne náklady na poskytnutie informácií alebo primeraný poplatok zohľadňujúci jej administratívne náklady na oznámenie, resp. na uskutočnenie požadovaného opatrenia alebo má právo odmietnuť na základe takejto žiadosti konať.
            </p>
          </section>

          <section>
            <p>
              V prípade pochybností o dodržiavaní povinností súvisiacich so spracúvaním osobných údajov sa môžete obrátiť priamo na prevádzkovateľa, a to u zodpovednej osoby na adrese <a href="mailto:gdpr@nitracik.sk" className="text-blue-600 hover:underline">gdpr@nitracik.sk</a>.
            </p>
            <p className="mt-2">
              Zároveň máte právo obrátiť sa so sťažnosťou na Úrad na ochranu osobných údajov Slovenskej republiky, so sídlom Budova Park one, Námestie 1. mája 18, 811 06 Bratislava, e-mail: <a href="mailto:statny.dozor@pdp.gov.sk" className="text-blue-600 hover:underline">statny.dozor@pdp.gov.sk</a>, www: <a href="https://dataprotection.gov.sk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://dataprotection.gov.sk/</a>.
            </p>
          </section>

          <section>
            <p>
              Aktuálna verzia tohto dokumentu sa nachádza aj v sídle prevádzkovateľa a na internetovej webovej stránke <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://nitracik.sk/</a>, v časti Ochrana osobných údajov.
            </p>
          </section>

          <section className="text-right text-gray-600 italic">
            <p>V Nitre dňa 18.02.2026</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PhotoConsentInfo;