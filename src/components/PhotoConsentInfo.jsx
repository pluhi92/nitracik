import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronUp, ShieldCheck, FileText, Mail, Info } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

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
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-16 container-custom max-w-4xl mx-auto px-4 sm:px-6 relative"
    >
      <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-8 sm:p-12 md:p-16">
        
        {/* Back Link */}
        <Link 
          to="/gdpr" 
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary font-bold mb-8 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Späť na GDPR</span>
        </Link>
        
        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-10 text-center pb-8 border-b border-neutral-100 uppercase tracking-tight">
          Súhlas so spracúvaním osobných údajov a s vyhotovením zvukového, obrazového, alebo zvukovo-obrazového záznamu na propagačné účely
        </h1>

        <div className="space-y-8 text-neutral-600 leading-relaxed font-medium text-justify">

          <section className="bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
            <p>
              Zakliknutím na checkbox v rámci Užívateľského konta na <a href="https://www.nitracik.sk" className="text-primary hover:text-primary-600 font-bold hover:underline">www.nitracik.sk</a> udeľujeme v zmysle Nariadenia Európskeho parlamentu a Rady (EÚ) 2016/679 z 27. apríla 2016 o ochrane fyzických osôb pri spracúvaní osobných údajov a o voľnom pohybe takýchto údajov, ktorým sa zrušuje smernica 95/46/ES (ďalej len „Nariadenie“) týmto udeľujeme <strong className="text-foreground">Občianske združenie Nitráčik o.z.</strong>, so sídlom na Hydinárska 13A Nitra 94901, IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205 (ďalej len „občianske združenie“ alebo „prevádzkovateľ“ alebo „Nitráčik o.z.,“) ako prevádzkovateľovi dobrovoľný a bezodplatný súhlas so spracúvaním osobných údajov nášho dieťaťa ako dotknutej osoby v nižšie uvedenom rozsahu na nižšie uvedený účel spracúvania, a to za nasledovných podmienok:
            </p>
          </section>

          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-foreground mb-2 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Účel spracúvania osobných údajov:
              </h2>
              <p>Propagácia občianskeho združenia a jeho aktivít na oficiálnej webstránke www.nitracik.sk a jeho profiloch na sociálnych sieťach Facebook a Instagram a v priestoroch občianskeho združenia.</p>
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-foreground mb-2">Rozsah spracúvaných osobných údajov:</h2>
              <p>Meno, priezvisko, fotografia, zvukový, obrazový, zvukovo-obrazový záznam.</p>
            </div>

            <p className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 text-sm">
              Osobné údaje sa spracúvajú o zákonných zástupcoch, informácii o tom kedy bol udelený súhlas a kedy bol odvolaný. Informácia o dôkaze o udelení súhlasu sa uchovávať 5 rokov odo dňa skončenia platnosti súhlasu, alebo odo dňa odvolania súhlasu.
            </p>

            <div>
              <h2 className="text-lg font-extrabold text-foreground mb-2">Právny základ spracúvania osobných údajov:</h2>
              <p>Čl. 6 ods. 1 písm. a) Nariadenia - súhlas dotknutej osoby.</p>
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-foreground mb-2">Doba udelenia súhlasu:</h2>
              <p className="mb-2">Občianske združenie bude spracúvať osobné údaje:</p>
              <ol className="list-decimal pl-6 space-y-2 marker:text-primary marker:font-bold">
                <li>vyhotovovaním fotografií, zvukových, obrazových, zvukovo-obrazových záznamov po kým Vaše dieťa bude navštevovať podujatia organizované občianskym združením,</li>
                <li>fotografie budú zverejnené 5 rokov nasledujúcich po roku v ktorom boli vyhotovené.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-foreground mb-3">Osobné údaje budú zverejnené:</h2>
            <ul className="list-disc pl-6 space-y-2 marker:text-primary">
              <li>V priestoroch občianskeho združenia,</li>
              <li>Na webovej stránke <a href="https://www.nitracik.sk" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 font-bold hover:underline">www.nitracik.sk</a>,</li>
              <li>Na sociálnej sieti Facebook: <a href="https://www.facebook.com/people/Nitr%C3%A1%C4%8Dik/61558994166250/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 font-bold hover:underline break-all">https://www.facebook.com/people/Nitráčik/61558994166250/</a>,</li>
              <li>Na sociálnej sieti Instagram: <a href="https://www.instagram.com/nitracik" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 font-bold hover:underline">https://www.instagram.com/nitracik</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-extrabold text-foreground mb-3">Príjemcovia spracúvania osobných údajov:</h2>
            <ul className="list-disc pl-6 space-y-2 marker:text-primary">
              <li>subjekty, ktorým poskytnutie osobných údajov vyplýva prevádzkovateľovi zo zákona;</li>
              <li>odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti;</li>
              <li>spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby.</li>
            </ul>
          </section>

          <section className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
            <h2 className="text-lg font-extrabold text-amber-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5" /> Odvolanie súhlasu
            </h2>
            <p className="mb-3 text-amber-800">Beriem na vedomie, že súhlas je možné odvolať zaslaním odvolania súhlasu buď:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2 text-amber-800 marker:text-amber-500">
              <li>(i) e-mailom na <a href="mailto:gdpr@nitracik.sk" className="font-bold hover:underline">gdpr@nitracik.sk</a>;</li>
              <li>(ii) písomne na adresu sídla prevádzkovateľa;</li>
              <li>(iii) alebo osobne v sídle prevádzkovateľa.</li>
            </ul>
            <p className="text-sm font-bold text-amber-900 bg-amber-100/50 p-3 rounded-xl border border-amber-200/50">
              Odvolanie je potrebné označiť poznámkou “OSOBNÉ ÚDAJE“. Odvolanie súhlasu nebude mať vplyv na zákonnosť spracúvania osobných údajov uskutočnených pred jeho odvolaním.
            </p>
          </section>

          <section>
            <p className="mb-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span>Beriem na vedomie, že spoločnosť nevyužíva spracúvané osobné údaje na účely automatizovaného rozhodovania, vrátane profilovania.</span>
            </p>
            <p className="mb-3">
              V rámci spracúvania osobných údajov nedochádza k ich prenosu do tretích krajín mimo územia EHS. Prenos však môže vykonávať prevádzkovateľ nasledovných sociálnych sietí:
            </p>
            <ul className="list-disc pl-6 space-y-2 marker:text-primary">
              <li>Facebook – viac o ochrane osobných údajov nájdete tu: <a href="https://www.facebook.com/privacy/policy/?locale=sk_SK" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 font-bold hover:underline">Ochrana súkromia Meta</a></li>
              <li>Instagram – viac o ochrane osobných údajov nájdete tu: <a href="https://help.instagram.com/581066165581870/?locale=sk_SK&hl=sk" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 font-bold hover:underline">Ochrana súkromia Instagram</a></li>
            </ul>
          </section>

          <section>
            <p className="mb-4">
              Potvrdzujem, že som bol/a ako dotknutá osoba informovaný/á, že všetky aktuálne podmienky spracúvania osobných údajov sa nachádzajú na intranete spoločnosti v časti GDPR a v tlačenej forme v sídle spoločnosti, a že tieto som si pred udelením súhlasu riadne prečítal/a.
            </p>
            <p>
              Ako dotknutá osoba beriem pritom osobitne na vedomie, že mám právo na prístup k osobným údajom, na opravu, na výmaz, právo na obmedzenie spracúvania osobných údajov, právo na prenosnosť v prípade automatizovaného spracúvania ako aj právo obrátiť sa so sťažnosťou na Úrad na ochranu osobných údajov SR.
            </p>
          </section>

          <section className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
            <h2 className="text-lg font-extrabold text-primary-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Súhlas podľa Občianskeho zákonníka
            </h2>
            <p className="text-primary-800">
              Zároveň týmto ako dotknutá osoba udeľujem dobrovoľný bezodplatný súhlas prevádzkovateľovi, aby v súlade s ust. § 12 a nasl. zák. č. 40/1964 Zb. Občianskeho zákonníka SR, vyhotovoval, spracúval, použil, zverejnil a šíril fotografie, podobizne, zvukové, obrazové alebo zvukovo-obrazové záznamy a prejavy osobnej povahy nášho dieťaťa za vyššie uvedeným účelom, vo vyššie uvedenom rozsahu a dobe spracúvania.
            </p>
          </section>

          <section className="space-y-4">
            <p>
              Podrobné informácie o jednotlivých právach dotknutých osôb a spôsobe ich uplatnenia sú uvedené na <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 font-bold hover:underline">https://nitracik.sk/</a> v časti Ochrana osobných údajov.
            </p>
            <p>
              Žiadosti v súvislosti s vyššie uvedenými právami je dotknutá osoba oprávnená uplatniť na adrese <a href="mailto:gdpr@nitracik.sk" className="text-primary hover:text-primary-600 font-bold hover:underline">gdpr@nitracik.sk</a>, resp. formou doporučeného listu doručeného prevádzkovateľovi – jeho zodpovednej osobe, prípadne osobne v sídle prevádzkovateľa.
            </p>
            <p className="text-sm bg-neutral-50 p-4 rounded-xl border border-neutral-100">
              Odpovede na uvedené žiadosti dotknutej osoby alebo opatrenia prijaté na základe týchto žiadostí sa poskytujú bezodplatne. Ak je žiadosť dotknutej osoby zjavne neopodstatnená alebo neprimeraná, najmä pre jej opakujúcu sa povahu (opakovaná žiadosť), prevádzkovateľ má právo účtovať si poplatok zohľadňujúci jej administratívne náklady na poskytnutie informácií alebo primeraný poplatok zohľadňujúci jej administratívne náklady na oznámenie, resp. na uskutočnenie požadovaného opatrenia alebo má právo odmietnuť na základe takejto žiadosti konať.
            </p>
          </section>

          <section className="space-y-4">
            <p>
              V prípade pochybností o dodržiavaní povinností súvisiacich so spracúvaním osobných údajov sa môžete obrátiť priamo na prevádzkovateľa, a to u zodpovednej osoby na adrese <a href="mailto:gdpr@nitracik.sk" className="text-primary hover:text-primary-600 font-bold hover:underline">gdpr@nitracik.sk</a>.
            </p>
            <p>
              Zároveň máte právo obrátiť sa so sťažnosťou na Úrad na ochranu osobných údajov Slovenskej republiky, so sídlom Budova Park one, Námestie 1. mája 18, 811 06 Bratislava, e-mail: <a href="mailto:statny.dozor@pdp.gov.sk" className="text-primary hover:text-primary-600 font-bold hover:underline">statny.dozor@pdp.gov.sk</a>, www: <a href="https://dataprotection.gov.sk/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 font-bold hover:underline">https://dataprotection.gov.sk/</a>.
            </p>
          </section>

          <section>
            <p>
              Aktuálna verzia tohto dokumentu sa nachádza aj v sídle prevádzkovateľa a na internetovej webovej stránke <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-600 font-bold hover:underline">https://nitracik.sk/</a>, v časti Ochrana osobných údajov.
            </p>
          </section>

          <section className="text-right text-neutral-400 font-bold pt-8 border-t border-neutral-100">
            <p>V Nitre dňa 18.02.2026</p>
          </section>
        </div>
      </div>

      {/* Modern Scroll to top button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-primary hover:bg-primary-600 text-white rounded-full shadow-lg transition-all duration-300 z-50 w-14 h-14 flex items-center justify-center cursor-pointer border-2 border-white"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default PhotoConsentInfo;