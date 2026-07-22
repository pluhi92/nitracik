import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronUp, Mail } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const ContactFormInfo = () => {
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
        
        <Link 
          to="/gdpr" 
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary font-bold mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Späť na GDPR</span>
        </Link>
        
        <div className="text-center pb-4 mb-6 border-b border-neutral-100">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">
            Podmienky a informácie o spracúvaní osobných údajov – KONTAKTNÝ FORMULÁR
          </h1>
        </div>

        <div className="space-y-8 text-neutral-600 leading-relaxed font-medium text-justify">

          <section>
            <p>
              Občianske združenie Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901, IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205 (ďalej len "občianske združenie" alebo "prevádzkovateľ" alebo „Nitráčik o.z.,") ako prevádzkovateľ získava a spracúva osobné údaje dotknutých osôb, ktorým týmto poskytuje informácie v zmysle Nariadenia Európskeho parlamentu a Rady (EÚ) 2016/679 z 27.04.2016 o ochrane fyzických osôb pri spracúvaní osobných údajov a o voľnom pohybe takýchto údajov, ktorým sa zrušuje smernica 95/46/ES (ďalej len "GDPR" alebo „Nariadenie").
            </p>
          </section>

          <section>
            <p>
              Podľa vzťahu prevádzkovateľom sú v tabuľke nižšie uvedené účely spracovania osobných údajov (ďalej len "OÚ") z ktorých je zrejmá kategória dotknutých osôb, právny základ na ich spracovanie, kategórie spracúvaných OÚ ako aj doba, po ktorú bude prevádzkovateľ tieto OÚ spracovávať.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold text-foreground mb-4">Právo namietať proti spracúvaniu osobných údajov</h2>
            <p>
              Proti spracúvaniu Vašich osobných údajov, ktoré je založené na našich oprávnených záujmoch, môžete kedykoľvek namietať, aj bez uvedenia dôvodov. Námietku musíme riadne posúdiť. Ak nepreukážeme, že máme na spracúvanie Vašich osobných údajov nevyhnutné oprávnené dôvody a že tieto prevažujú nad Vašimi záujmami, právami a slobodami, nebudeme Vaše osobné údaje ďalej spracúvať.
            </p>
            <p className="mt-4">
              Vašu námietku môžete zaslať písomne na adresu: Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901 alebo emailom na{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-primary font-bold hover:underline">gdpr@nitracik.sk</a>.
            </p>
          </section>

          <hr className="border-neutral-100" />

          <section>
            <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-sm">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="border-r border-neutral-200 px-4 py-3 text-left font-bold text-foreground">Dotknuté osoby</th>
                    <th className="border-r border-neutral-200 px-4 py-3 text-left font-bold text-foreground">Účel spracúvania OÚ</th>
                    <th className="border-r border-neutral-200 px-4 py-3 text-left font-bold text-foreground">Právny základ spracúvania OÚ</th>
                    <th className="border-r border-neutral-200 px-4 py-3 text-left font-bold text-foreground">Doba spracúvania</th>
                    <th className="px-4 py-3 text-left font-bold text-foreground">Príjemcovia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  <tr>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">1. Fyzická osoba, ktorá oslovila prevádzkovateľa prostredníctvom online formulára</td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      <strong className="text-foreground">AGENDA KONTAKTNÝ FORMULÁR</strong><br/>
                      Účelom spracúvania osobných údajov je umožnenie dotknutým osobám kontaktovať prevádzkovateľa s otázkami, dotazmi a zasielanie odpovedí a informovanie dotknutých osôb o spôsobe vybavenia vzneseného podnetu, nápadu, otázky, pripomienok, požiadavky.
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      čl. 6 ods. 1 písm. f) Nariadenia – OPRÁVNENÝ ZÁUJEM<br/><br/>
                      Oprávneným záujmom je: identifikácia osoby, ktorá prostredníctvom kontaktného formulára oslovila prevádzkovateľa so svojou požiadavkou. Možnosť s ňou komunikovať a vybaviť jej požiadavku
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">6 mesiacov odo dňa vybavenia požiadavky</td>
                    <td className="px-4 py-3 align-top">subjekty, ktorým prevádzkovateľ poskytuje OÚ na základe zákona, odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti, spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby; spoločnosť poskytujúca</td>
                  </tr>
                  <tr>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">2. fyzické osoby uplatňujúce svoje práva ako dotknuté osoby</td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      <strong className="text-foreground">UPLATNENIE PRÁV DOTKNUTEJ OSOBY</strong><br/>
                      Účelom spracúvania OÚ je uplatňovanie práv dotknutých osôb podľa GDPR. (tento účel sa vzťahuje na prípady, keď dôjde k uplatneniu Vašich práv podľa GDPR)
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      spracúvanie je v zmysle čl. 6 ods. 1 písm. c) Nariadenia nevyhnutné na splnenie zákonnej povinnosti prevádzkovateľa vyplývajúcej z nariadenia a zo zákona č. 18/2018 Z. z.
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">5 rokov nasledujúcich po roku, v ktorom bola žiadosť vybavená</td>
                    <td className="px-4 py-3 align-top">subjekty, ktorým prevádzkovateľ poskytuje osobné údaje na základe zákona; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti; spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby;</td>
                  </tr>
                  <tr>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">3. Strany sporu, účastníci konania a ďalšie zúčastnené osoby</td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      <strong className="text-foreground">AGENDA VYBAVOVANIA SÚDNYCH SPOROV, EXEKÚCIÍ, VYMÁHANIE POHĽADÁVOK</strong><br/>
                      Účelom spracúvania OÚ je vybavovanie súdnych sporov, exekúcií a vymáhania pohľadávok.
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      čl. 6 ods. 1 písm. c) Nariadenia - nevyhnutné na splnenie ZÁKONNÝCH POVINNOSTÍ prevádzkovateľa vyplývajúcich zo zák. č. 160/2015 Z. z., zák. č. 244/2002 Z. z., zák. č. 301/2005 Z. z., zák. č. 7/2005 Z. z., zák. č. 38/1993 Z. z., zák. č. 162/2015 Z. z., zák. č. 233/1995 Z. z. a súvisiacich právnych predpisov
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">10 rokov po právoplatnom skočení príslušného konania</td>
                    <td className="px-4 py-3 align-top">súdy, exekútori, advokáti a iné orgány verejnej správy a subjekty, ktorým Prevádzkovateľ poskytuje OÚ na základe zákona, odborní konzultanti a poradcovia ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-neutral-100" />

          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-3">VŠEOBECNE:</h2>
            <p>
              V prípade, ak je pri niektorom z účelov spracúvania právnym základom pre spracúvanie OÚ zmluva, poskytnutie týchto údajov predstavuje zmluvnú požiadavku pre plnenie v zmysle predmetnej zmluvy. V prípade neposkytnutia týchto údajov, nie je možné uzatvorenie zmluvného vzťahu, ako ani následné plnenie zo zmluvy. V prípade, ak je právnym základom pre spracúvanie OÚ zákon, poskytnutie týchto údajov je zákonnou požiadavkou. V prípade neposkytnutia týchto údajov, nie je možné zabezpečiť riadne plnenie povinností prevádzkovateľa, ktoré jej vyplývajú z príslušných všeobecných právnych predpisov.
            </p>
          </section>

          <section>
            <p>
              Prevádzkovateľ uskutočňuje prenos OÚ do tretích krajín (mimo EÚ/EHS), v prípade emailovej komunikácie sa využíva Google Workspace, kde sprostredkovateľ spoločnosť Google Ireland Ltd. môže mať subdodávateľov v tretích krajinách, ktoré zaručujú primeranú úroveň ochrany osobných údajov Japonsko – Rozhodnutie Komisie 2019/419, Švajčiarsko – Rozhodnutie Komisie č. 2000/518/EC, Veľká Británia - Rozhodnutie Komisie 2021/1772, Rozhodnutie Komisie 2021/1773 ako aj v tretích krajinách, ktoré nezaručujú primeranú úroveň ochrany osobných údajov ako je napr. India, Mexiko, USA, Malajzia s uvedenými subdodávateľmi má Google uzatvorené štandardné zmluvné doložky – konkrétny zoznam subdodávateľov nájdete na{' '}
              <a href="https://workspace.google.com/intl/en/terms/subprocessors.html" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                https://workspace.google.com/intl/en/terms/subprocessors.html
              </a>.
            </p>
          </section>

          <section>
            <p>
              <strong className="text-foreground">Zdroj:</strong> Prevádzkovateľ získava OÚ v prvom rade od dotknutých osôb, alebo ich vytvoril prevádzkovateľ.
            </p>
            <p className="mt-3">
              <strong className="text-foreground">Kategória OÚ, ktoré nemá prevádzkovateľ priamo od dotknutej osoby:</strong> dátum a čas doručenia požiadavky a obsah a odpoveď na požiadavku doručenú prostredníctvom kontaktného formulára.
            </p>
          </section>

          <hr className="border-neutral-100" />

          <section>
            <h2 className="text-2xl font-extrabold text-foreground mb-4">Práva dotknutých osôb</h2>
            <p className="mb-4">V súvislosti so spracúvaním OÚ má dotknutá osoba najmä nasledovné práva:</p>
            
            <div className="space-y-6">
              <div>
                <p className="mb-2"><strong className="text-foreground">1) Právo na prístup k OÚ</strong></p>
                <p>
                  Na základe žiadosti vyžadovať od prevádzkovateľa právo na prístup k OÚ (právo na prístup), t. j. dotknutá osoba má právo získať od Prevádzkovateľa potvrdenie o tom, či sa spracúvajú OÚ, ktoré sa jej týkajú, a ak tomu tak je, má právo získať prístup k týmto OÚ a tieto informácie:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-primary">
                  <li>účely spracúvania;</li>
                  <li>kategórie dotknutých OÚ;</li>
                  <li>príjemcovia alebo kategórie príjemcov, ktorým boli alebo budú OÚ poskytnuté, najmä príjemcovia v tretích krajinách alebo medzinárodné organizácie;</li>
                  <li>ak je to možné, predpokladaná doba uchovávania OÚ alebo, ak to nie je možné, kritériá na jej určenie;</li>
                  <li>existencia práva požadovať od Prevádzkovateľa opravu OÚ týkajúcich sa dotknutej osoby alebo ich vymazanie alebo obmedzenie spracúvania, alebo práva namietať proti takémuto spracúvaniu;</li>
                  <li>právo podať sťažnosť dozornému orgánu;</li>
                  <li>ak sa OÚ nezískali od dotknutej osoby, akékoľvek dostupné informácie, pokiaľ ide o ich zdroj;</li>
                  <li>existencia automatizovaného rozhodovania vrátane profilovania uvedeného v článku 22 ods. 1 a 4 Nariadenia a v týchto prípadoch aspoň zmysluplné informácie o použitom postupe, ako aj význame a predpokladaných dôsledkoch takéhoto spracúvania pre dotknutú osobu;</li>
                  <li>ak sa OÚ prenášajú do tretej krajiny alebo medzinárodnej organizácii, dotknutá osoba má právo byť informovaná o primeraných zárukách podľa článku 46 Nariadenia týkajúcich sa prenosu;</li>
                </ul>
              </div>

              <div>
                <p className="mb-1"><strong className="text-foreground">2) Právo na opravu</strong></p>
                <p>Na základe žiadosti vyžadovať od prevádzkovateľa opravu nesprávnych alebo neaktuálnych OÚ, resp. doplnenie neúplných OÚ (právo na opravu);</p>
              </div>

              <div>
                <p className="mb-2"><strong className="text-foreground">3) Právo na výmaz</strong></p>
                <p>Na základe žiadosti vyžadovať od prevádzkovateľa vymazanie/likvidáciu OÚ (právo na výmaz), ak:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-primary">
                  <li>OÚ už nie sú potrebné na účel, na ktorý sa získali alebo inak spracúvali,</li>
                  <li>v prípadoch, kedy boli OÚ spracúvané na základe súhlasu a tento súhlas so spracúvaním OÚ bol odvolaný, pričom neexistuje iný právny základ na spracúvanie OÚ alebo iná zákonná výnimka;</li>
                  <li>ak dotknutá osoba namieta spracúvanie OÚ na základe oprávneného záujmu a neprevažujú žiadne oprávnené dôvody na spracúvanie alebo dotknutá osoba namieta voči priamemu marketingu;</li>
                  <li>OÚ sú spracúvané nezákonne;</li>
                  <li>na to, aby sa splnila zákonná povinnosť, musia byť OÚ vymazené;</li>
                  <li>OÚ sa získavali v súvislosti s ponukou služieb informačnej spoločnosti podľa článku 8 ods. 1 Nariadenia;</li>
                </ul>
              </div>

              <div>
                <p className="mb-2"><strong className="text-foreground">4) Právo na obmedzenie spracúvania</strong></p>
                <p>Na základe žiadosti vyžadovať od prevádzkovateľa obmedzenie spracúvania OÚ (právo na obmedzenie spracúvania), ak:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-primary">
                  <li>dotknutá osoba napadne správnosť OÚ, a to počas obdobia umožňujúceho prevádzkovateľovi overiť správnosť OÚ;</li>
                  <li>spracúvanie OÚ je protizákonné a dotknutá osoba namieta proti vymazaniu OÚ a žiada namiesto toho obmedzenie ich použitia;</li>
                  <li>prevádzkovateľ už nepotrebuje OÚ na účely spracúvania OÚ, ale potrebuje ich dotknutá osoba na preukázanie, uplatňovanie alebo obhajovanie právnych nárokov;</li>
                  <li>dotknutá osoba namietala voči spracúvaniu podľa článku 21 ods. 1 Nariadenia, a to až do overenia, či oprávnené dôvody na strane Prevádzkovateľa prevažujú nad oprávnenými dôvodmi dotknutej osoby;</li>
                </ul>
              </div>

              <div>
                <p className="mb-1"><strong className="text-foreground">5) Právo podať návrh</strong></p>
                <p>Podať návrh na začatie konania na Úrade na ochranu OÚ SR;</p>
              </div>

              <div>
                <p className="mb-2"><strong className="text-foreground">6) Právo na prenosnosť</strong></p>
                <p>
                  Dotknutá osoba má právo získať OÚ, ktoré sa jej týkajú a ktoré poskytla Prevádzkovateľovi, v štruktúrovanom, bežne používanom a strojovo čitateľnom formáte a má právo preniesť tieto údaje ďalšiemu Prevádzkovateľovi bez toho, aby jej Prevádzkovateľ, ktorému sa tieto osobné údaje poskytli, bránil, ak (právo na prenosnosť):
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-primary">
                  <li>sa spracúvanie zakladá na súhlase podľa článku 6 ods. 1 písm. a) alebo článku 9 ods. 2 písm. a), alebo na zmluve podľa článku 6 ods. 1 písm. b), a</li>
                  <li>ak sa spracúvanie vykonáva automatizovanými prostriedkami.</li>
                </ul>
                <p className="mt-2">
                  Dotknutá osoba má pri uplatňovaní svojho práva na prenosnosť údajov právo na prenos OÚ priamo od jedného Prevádzkovateľa druhému Prevádzkovateľovi, pokiaľ je to technicky možné.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-neutral-100" />

          <section>
            <p>
              Podrobné informácie o jednotlivých právach dotknutých osôb a spôsobe ich uplatnenia sú uvedené na{' '}
              <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                https://nitracik.sk/
              </a>{' '}
              v časti Ochrana osobných údajov. Žiadosti v súvislosti s vyššie uvedenými právami je dotknutá osoba oprávnená uplatniť na adrese{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-primary font-bold hover:underline">gdpr@nitracik.sk</a>, resp. formou doporučeného listu doručeného prevádzkovateľovi – jeho zodpovednej osobe, prípadne osobne v sídle prevádzkovateľa.
            </p>
          </section>

          <section>
            <p>
              Odpovede na uvedené žiadosti dotknutej osoby alebo opatrenia prijaté na základe týchto žiadostí sa poskytujú bezodplatne. Ak je žiadosť dotknutej osoby zjavne neopodstatnená alebo neprimeraná, najmä pre jej opakujúcu sa povahu (opakovaná žiadosť), prevádzkovateľ má právo účtovať si poplatok zohľadňujúci jej administratívne náklady na poskytnutie informácií alebo primeraný poplatok zohľadňujúci jej administratívne náklady na oznámenie, resp. na uskutočnenie požadovaného opatrenia alebo má právo odmietnuť na základe takejto žiadosti konať.
            </p>
          </section>

          <section>
            <p>
              V prípade pochybností o dodržiavaní povinností súvisiacich so spracúvaním osobných údajov sa môžete obrátiť priamo na prevádzkovateľa, a to u zodpovednej osoby na adrese{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-primary font-bold hover:underline">gdpr@nitracik.sk</a>. Zároveň máte právo obrátiť sa so sťažnosťou na Úrad na ochranu osobných údajov Slovenskej republiky, so sídlom Budova Park one, Námestie 1. mája 18, 811 06 Bratislava, e-mail:{' '}
              <a href="mailto:statny.dozor@pdp.gov.sk" className="text-primary font-bold hover:underline">statny.dozor@pdp.gov.sk</a>, www:{' '}
              <a href="https://dataprotection.gov.sk/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                https://dataprotection.gov.sk/
              </a>.
            </p>
          </section>

          <section>
            <p>
              Aktuálna verzia tohto dokumentu sa nachádza aj v sídle prevádzkovateľa a na internetovej webovej stránke{' '}
              <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                https://nitracik.sk/
              </a>, v časti Ochrana osobných údajov.
            </p>
          </section>

          <section className="text-right text-neutral-400 font-bold pt-6 border-t border-neutral-100">
            <p>V Nitre dňa 18.02.2026</p>
          </section>
        </div>
      </div>

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

export default ContactFormInfo;