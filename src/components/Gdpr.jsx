import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, FileText, ArrowRight } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const Gdpr = () => {
  const location = useLocation();

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, [location]);

  return (
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="py-12 md:py-16 container-custom max-w-4xl mx-auto px-4 sm:px-6 relative"
    >
      <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 p-8 sm:p-12 md:p-16">
        
        {/* Hlavný nadpis - zmenšený padding a margin dole */}
        <div className="text-center pb-4 mb-6 border-b border-neutral-100">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">
            Ochrana osobných údajov
          </h1>
        </div>

        <div className="space-y-8 text-neutral-600 leading-relaxed font-medium text-justify">
          
          {/* Úvodné ustanovenia */}
          <section className="space-y-3">
            <p>
              Spracúvanie osobných údajov dotknutých osôb sa riadi Nariadením Európskeho parlamentu a Rady (EÚ) 2016/679 z 27. apríla 2016 o ochrane fyzických osôb pri spracúvaní osobných údajov a o voľnom pohybe takýchto údajov, ktorým sa zrušuje smernica 95/46/ES (všeobecné nariadenie o ochrane údajov) (ďalej len „Nariadenie“).
            </p>
            <p>
              <strong className="text-foreground">Nitráčik o.z.</strong>, so sídlom na Hydinárska 13A Nitra 94901, IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205 plne rešpektuje ochranu Vášho súkromia a váži si dôveru, ktorú nám pri spracúvaní osobných údajov zverujete.
            </p>
            <p>
              Na ochranu spracúvaných osobných údajov sme zaviedli všetky primerané bezpečnostné opatrenia technického, organizačného a iného charakteru a procesy na kontrolu ich priebežného dodržiavania a dostatočnosti.
            </p>
            <p>
              V tejto sekcii sa dozviete, ako nakladáme s Vašimi osobnými údajmi a aké sú Vaše práva v zmysle Nariadenia.
            </p>
          </section>

          <hr className="border-neutral-100" />

          {/* 1. Základné pojmy */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">1. Základné pojmy</h2>
            <p className="mb-4">
              Prevádzkovateľ je presvedčený, že jasné informácie prispievajú k lepšiemu porozumeniu pravidiel spracúvania osobných údajov, preto v nasledujúcej časti uvádza najdôležitejšie pojmy používané v súvislosti s ochranou osobných údajov:
            </p>
            <ul className="space-y-3 list-disc pl-5 marker:text-primary">
              <li>
                <strong className="text-foreground">Osobné údaje:</strong> akékoľvek informácie týkajúce sa identifikovanej alebo identifikovateľnej fyzickej osoby (meno, identifikačné číslo, lokalizačné údaje, online identifikátor a pod.).
              </li>
              <li>
                <strong className="text-foreground">Dotknutá osoba:</strong> identifikovaná alebo identifikovateľná fyzická osoba, ktorej sa osobné údaje týkajú (návštevníci webstránky, registrované osoby a pod.).
              </li>
              <li>
                <strong className="text-foreground">Prevádzkovateľ:</strong> Nitráčik o.z., so sídlom na Hydinárska 167/13A Nitra 94901, IČO: 56374453, ktorá určuje podmienky spracúvania a zodpovedá za ne.
              </li>
              <li>
                <strong className="text-foreground">Sprostredkovateľ:</strong> subjekt, ktorý spracúva osobné údaje v mene prevádzkovateľa na základe poverenia.
              </li>
              <li>
                <strong className="text-foreground">Spracúvanie:</strong> operácie vykonávané s osobnými údajmi (získavanie, uchovávanie, prehliadanie, vymazanie atď.).
              </li>
            </ul>
          </section>

          <hr className="border-neutral-100" />

          {/* 2. Prevádzkovateľ */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-2">2. Prevádzkovateľ</h2>
            <p>
              Prevádzkovateľom je <strong className="text-foreground">Nitráčik o.z.</strong>, so sídlom na Hydinárska 167/13A Nitra 94901, IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205.
            </p>
          </section>

          <hr className="border-neutral-100" />

          {/* 3. Zodpovednosť za spracúvanie */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-2">3. Zodpovednosť za spracúvanie osobných údajov</h2>
            <p>
              V prípade akýchkoľvek otázok alebo požiadaviek ohľadom spracúvania osobných údajov nás môžete kontaktovať na adrese sídla alebo na e-mailovej adrese:{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-primary font-bold hover:underline">
                gdpr@nitracik.sk
              </a>
            </p>
          </section>

          <hr className="border-neutral-100" />

          {/* 4. Výkon práv - Formuláre pekne pod sebou */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-2">4. Výkon práv dotknutých osôb</h2>
            <p className="mb-4">
              Akým spôsobom môžete uplatniť svoje práva a aký je postup pri ich napĺňaní sa dozviete v nasledujúcich dokumentoch na stiahnutie:
            </p>
            <div className="flex flex-col items-start gap-2.5">
              <a
                href="/documents/Gdpr/ver01_2026_Činnosť pri výkone práv dotknutých osôb.pdf"
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                download
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>Činnosť pri napĺňaní práv dotknutej osoby (PDF)</span>
              </a>
              <a
                href="/documents/Gdpr/ver01_2026_Práva dotknutých osôb.pdf"
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                download
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>Práva dotknutých osôb (PDF)</span>
              </a>
              <a
                href="/documents/Gdpr/ver01_2026_Žiadosť na výkon práva dotknutej osoby.pdf"
                className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                download
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>Formulár na uplatnenie si práva dotknutej osoby (PDF)</span>
              </a>
            </div>
          </section>

          <hr className="border-neutral-100" />

          {/* 5. Informačné povinnosti */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-2">5. Informačné povinnosti</h2>
            <p className="mb-4">
              Podrobné informácie o účeloch, právnych základoch a dobe uchovávania údajov pre jednotlivé oblasti:
            </p>
            <div className="flex flex-col items-start gap-2.5">
              <Link to="/gdpr/registration" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
                <span>Informácia o spracúvaní osobných údajov – registrácia</span>
              </Link>
              <Link to="/gdpr/cookies" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
                <span>Informácia o spracúvaní osobných údajov – cookies</span>
              </Link>
              <Link to="/gdpr/contact-form" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
                <span>Informácia o spracúvaní osobných údajov – kontaktný formulár</span>
              </Link>
              <Link to="/gdpr/social-networks" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
                <span>Informácia o spracúvaní osobných údajov – sociálne siete</span>
              </Link>
            </div>
          </section>

        </div>
      </div>
    </motion.section>
  );
};

export default Gdpr;