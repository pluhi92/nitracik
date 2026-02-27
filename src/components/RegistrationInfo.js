import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const RegistrationInfo = () => {
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
        
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center border-b pb-4">
          Podmienky a informácie o spracúvaní osobných údajov – Registrácia
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
              Občianske združenie Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901, IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205 (ďalej len "občianske združenie" alebo "prevádzkovateľ" alebo „Nitráčik o.z.") ako prevádzkovateľ www.nitracik.sk, získava a spracúva osobné údaje dotknutých osôb ako Prevádzkovateľ, ktorým týmto poskytuje informácie v zmysle Nariadenia Európskeho parlamentu a Rady (EÚ) 2016/679 z 27.04.2016 o ochrane fyzických osôb pri spracúvaní osobných údajov a o voľnom pohybe takýchto údajov, ktorým sa zrušuje smernica 95/46/ES ("GDPR").
            </p>
          </section>

          <section>
            <p>
              V tabuľke nižšie sú uvedené účely spracúvania osobných údajov (ďalej len "OÚ") z ktorých je zrejmá kategória dotknutých osôb, právny základ na ich spracúvanie, kategórie príjemcov, ako aj doba, po ktorú bude Prevádzkovateľ tieto OÚ spracúvať.
            </p>
          </section>

          <section>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Dotknuté osoby</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Účel spracúvania OÚ</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Právny základ spracúvania OÚ</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Doba spracúvania</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Príjemcovia</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">1. Fyzická osoba, ktorá sa zaregistrovala</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>AGENDA REGISTRÁCIE</strong><br/>
                      Účelom spracúvania OÚ je zriadenie užívateľského účtu, ktorý slúži na technickú správu rezervácií, evidenciu platieb, kreditov, permanentiek, a na ktorý je rezervácia a využívanie služieb viazané.
                    </td>
                    <td className="border border-gray-300 px-4 py-2">čl. 6 ods. 1 písm. b) Nariadenia - ZMLUVNÉ A PREDZMLUVNÉ VZŤAHY – bezodplatná zmluva</td>
                    <td className="border border-gray-300 px-4 py-2">3 roky od posledného prihlásenia sa do konta, alebo zrušením konta samotnou registrovanou osobou, podľa toho čo nastane skôr</td>
                    <td className="border border-gray-300 px-4 py-2">subjekty, ktorým prevádzkovateľ poskytuje OÚ na základe zákona, odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti, spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby; spoločnosť poskytujúca</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">2. Fyzická osoba, ktorá si zakúpila tovar alebo službu</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>AGENDA UZATVORENIA KÚPNEJ ZMLUVY</strong><br/>
                      Účelom spracúvania OÚ je uzatvorenie a plnenie kúpnej zmluvy v súvislosti s nákupom na stránke www.nitracik.sk
                    </td>
                    <td className="border border-gray-300 px-4 py-2">čl. 6 ods. 1 písm. b) Nariadenia - ZMLUVNÉ A PREDZMLUVNÉ VZŤAHY – kúpna zmluva</td>
                    <td className="border border-gray-300 px-4 py-2">10 rokov nasledujúcich po roku ktorého sa týkajú</td>
                    <td className="border border-gray-300 px-4 py-2">kuriérske spoločnosti, a iné subjekty, ktorým prevádzkovateľ poskytuje OÚ na základe zákona, odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti, spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby; spoločnosť poskytujúca</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">3. Fyzická osoba, ktorá si zakúpila tovar alebo službu</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>AGENDA ÚČTOVNÍCTVA</strong><br/>
                      Účelom spracúvania OÚ je vedenie účtovnej, obchodnej a finančnej dokumentácie. V prípade online nákupu tovaru Vám bude vystavená faktúra.
                    </td>
                    <td className="border border-gray-300 px-4 py-2">čl. 6 ods. 1 písm. c) Nariadenia - nevyhnutné na splnenie ZÁKONNÝCH POVINNOSTÍ prevádzkovateľa vyplývajúcich zo zák. č. 431/2002 Z. z., zák. č. 222/2004 Z. z., zák. č. 40/1964 Zb., zák. č. 311/2001 Z. z., zák. č. 595/2003 Z. z., zák. č. 582/2004 Z. z., zák. č. 283/2002 Z. z. a súvisiacich právnych predpisov</td>
                    <td className="border border-gray-300 px-4 py-2">10 rokov nasledujúcich po roku ktorého sa týkajú</td>
                    <td className="border border-gray-300 px-4 py-2">prevádzkovatelia platobných brán a iné subjekty, ktorým prevádzkovateľ poskytuje OÚ na základe zákona, odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti, spoločnosť poskytujúca účtovné služby; spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby; spoločnosť poskytujúca</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">4. Fyzická osoba, ktorá si zakúpila tovar alebo službu a nenamietla voči zasielaniu marketingových informácií</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>AGENDA MARKETINGU E-SHOP</strong><br/>
                      Účelom spracúvania OÚ je zasielanie marketingových newslettrov s informáciami o vlastných a podobných službách a dotazníkoch spokojnosti (napr. informácie o nových produktoch a pod.)
                    </td>
                    <td className="border border-gray-300 px-4 py-2">čl. 6 ods. 1 písm. f) Nariadenia - OPRÁVNENÝ ZÁUJEM. Oprávneným záujmom prevádzkovateľa je zasielanie newslettrov dotknutým osobám, ktoré obsahujú marketingové informácie týkajúce sa vlastných a podobných tovarov a služieb, ako bol kúpený tovar/služba, s cieľom informovania o novinkách, aktivitách, možnostiach na www.nitracik.sk a iných skutočnostiach súvisiacich s kúpou tovarov alebo služieb na www.nitracik.sk na základe § 116 ods. 15 zákona č. 452/2021 Z.z. o elektronických komunikáciách</td>
                    <td className="border border-gray-300 px-4 py-2">1 rok od vykonania posledného nákupu</td>
                    <td className="border border-gray-300 px-4 py-2">subjekty, ktorým prevádzkovateľ poskytuje OÚ na základe zákona, odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti, spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby;</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">5. Reklamujúca osoba</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>AGENDA REKLAMÁCIÍ</strong><br/>
                      Účelom spracúvania OÚ je vedenie agendy reklamácií.
                    </td>
                    <td className="border border-gray-300 px-4 py-2">čl. 6 ods. 1 písm. c) Nariadenia - nevyhnutné na splnenie ZÁKONNÝCH POVINNOSTÍ prevádzkovateľa vyplývajúcich zo zák. č. 108/2024 Z. z.</td>
                    <td className="border border-gray-300 px-4 py-2">10 rokov po ukončení reklamácie</td>
                    <td className="border border-gray-300 px-4 py-2">Slovenská obchodná inšpekcia a iné subjekty, ktorým prevádzkovateľ poskytuje OÚ na základe zákona, odborní konzultanti a poradcovia ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti, spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby; spoločnosť poskytujúca</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">6. fyzické osoby uplatňujúce svoje práva ako dotknuté osoby</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>Uplatnenie práv dotknutej osoby</strong><br/>
                      Účelom spracúvania OÚ je uplatňovanie práv dotknutých osôb podľa GDPR (tento účel sa vzťahuje na prípady, keď dôjde k uplatneniu Vašich práv podľa GDPR)
                    </td>
                    <td className="border border-gray-300 px-4 py-2">spracúvanie je v zmysle čl. 6 ods. 1 písm. c) Nariadenia nevyhnutné na splnenie zákonnej povinnosti prevádzkovateľa vyplývajúcej z nariadenia a zo zákona č. 18/2018 Z. z.</td>
                    <td className="border border-gray-300 px-4 py-2">5 rokov nasledujúcich po roku, v ktorom bola žiadosť vybavená</td>
                    <td className="border border-gray-300 px-4 py-2">subjekty, ktorým prevádzkovateľ poskytuje osobné údaje na základe zákona; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti; spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby; spoločnosť poskytujúca</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">7. Strany sporu, účastníci konania a ďalšie zúčastnené osoby</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>AGENDA VYBAVOVANIA SÚDNYCH SPOROV, EXEKÚCIÍ, VYMÁHANIE POHĽADÁVOK</strong><br/>
                      Účelom spracúvania OÚ je vybavovanie súdnych sporov, exekúcií a vymáhania pohľadávok.
                    </td>
                    <td className="border border-gray-300 px-4 py-2">čl. 6 ods. 1 písm. c) Nariadenia - nevyhnutné na splnenie ZÁKONNÝCH POVINNOSTÍ prevádzkovateľa vyplývajúcich zo zák. č. 160/2015 Z. z., zák. č. 244/2002 Z. z., zák. č. 301/2005 Z. z., zák. č. 7/2005 Z. z., zák. č. 38/1993 Z. z., zák. č. 162/2015 Z. z., zák. č. 233/1995 Z. z. a súvisiacich právnych predpisov</td>
                    <td className="border border-gray-300 px-4 py-2">10 rokov po právoplatnom skočení príslušného konania</td>
                    <td className="border border-gray-300 px-4 py-2">súdy, exekútori, advokáti a iné orgány verejnej správy a subjekty, ktorým Prevádzkovateľ poskytuje OÚ na základe zákona, spoločnosť zabezpečujúca skartáciu a archiváciu, odborní konzultanti a poradcovia ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">VŠEOBECNE:</h2>
            <p>
              V prípade, ak je pri niektorom z účelov spracúvania právnym základom pre spracúvanie OÚ zmluva, poskytnutie týchto údajov predstavuje zmluvnú požiadavku pre plnenie v zmysle predmetnej zmluvy. V prípade neposkytnutia týchto údajov, nie je možné uzatvorenie zmluvného vzťahu, ako ani následné plnenie zo zmluvy. V prípade, ak je právnym základom pre spracúvanie OÚ zákon, poskytnutie týchto údajov je zákonnou požiadavkou. V prípade neposkytnutia týchto údajov, nie je možné zabezpečiť riadne plnenie povinností prevádzkovateľa, ktoré jej vyplývajú z príslušných všeobecných právnych predpisov.
            </p>
          </section>

          <section>
            <p>
              Prevádzkovateľ uskutočňuje prenos OÚ do tretích krajín (mimo EÚ/EHS), v prípade emailovej komunikácie sa využíva Google Workspace, kde sprostredkovateľ spoločnosť Google Ireland Ltd. môže mať subdodávateľov v tretích krajinách, ktoré zaručujú primeranú úroveň ochrany osobných údajov Japonsko – Rozhodnutie Komisie 2019/419, Švajčiarsko – Rozhodnutie Komisie č. 2000/518/EC, Veľká Británia - Rozhodnutie Komisie 2021/1772, Rozhodnutie Komisie 2021/1773 ako aj v tretích krajinách, ktoré nezaručujú primeranú úroveň ochrany osobných údajov ako je napr. India, Mexiko, USA, Malajzia s uvedenými subdodávateľmi má Google uzatvorené štandardné zmluvné doložky – konkrétny zoznam subdodávateľov nájdete na{' '}
              <a href="https://workspace.google.com/intl/en/terms/subprocessors.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://workspace.google.com/intl/en/terms/subprocessors.html
              </a>.
            </p>
          </section>

          <section>
            <p>
              <strong>Zdroj:</strong> Prevádzkovateľ získava OÚ v prvom rade od dotknutých osôb, alebo ich vytvoril prevádzkovateľ.
            </p>
            <p>
              <strong>Kategória OÚ, ktoré nemá prevádzkovateľ priamo od dotknutej osoby:</strong> dátum a čas registrácie, dátum a čas posledného prihlásenia sa do konta, dátum a čas vytvorenia objednávky, obsah objednávky, informácia o námietke voči zasielaniu vlastných a podobných tovaroch a službách, informácie o rezervácií, evidencii platieb, kreditov, permanentiek.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Práva dotknutých osôb</h2>
            <p className="mb-3">V súvislosti so spracúvaním OÚ má dotknutá osoba najmä nasledovné práva:</p>
            
            <div className="space-y-4">
              <div>
                <p><strong>1) Právo na prístup k OÚ</strong></p>
                <p>
                  Na základe žiadosti vyžadovať od prevádzkovateľa právo na prístup k OÚ (právo na prístup), t. j. dotknutá osoba má právo získať od Prevádzkovateľa potvrdenie o tom, či sa spracúvajú OÚ, ktoré sa jej týkajú, a ak tomu tak je, má právo získať prístup k týmto OÚ a tieto informácie:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
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
                <p><strong>2) Právo na opravu</strong></p>
                <p>Na základe žiadosti vyžadovať od prevádzkovateľa opravu nesprávnych alebo neaktuálnych OÚ, resp. doplnenie neúplných OÚ (právo na opravu);</p>
              </div>

              <div>
                <p><strong>3) Právo na výmaz</strong></p>
                <p>Na základe žiadosti vyžadovať od prevádzkovateľa vymazanie/likvidáciu OÚ (právo na výmaz), ak:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>OÚ už nie sú potrebné na účel, na ktorý sa získali alebo inak spracúvali,</li>
                  <li>v prípadoch, kedy boli OÚ spracúvané na základe súhlasu a tento súhlas so spracúvaním OÚ bol odvolaný, pričom neexistuje iný právny základ na spracúvanie OÚ alebo iná zákonná výnimka;</li>
                  <li>ak dotknutá osoba namieta spracúvanie OÚ na základe oprávneného záujmu a neprevažujú žiadne oprávnené dôvody na spracúvanie alebo dotknutá osoba namieta voči priamemu marketingu;</li>
                  <li>OÚ sú spracúvané nezákonne;</li>
                  <li>na to, aby sa splnila zákonná povinnosť, musia byť OÚ vymazané;</li>
                  <li>OÚ sa získavali v súvislosti s ponukou služieb informačnej spoločnosti podľa článku 8 ods. 1 Nariadenia;</li>
                </ul>
              </div>

              <div>
                <p><strong>4) Právo na obmedzenie spracúvania</strong></p>
                <p>Na základe žiadosti vyžadovať od prevádzkovateľa obmedzenie spracúvania OÚ (právo na obmedzenie spracúvania), ak:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>dotknutá osoba napadne správnosť OÚ, a to počas obdobia umožňujúceho prevádzkovateľovi overiť správnosť OÚ;</li>
                  <li>spracúvanie OÚ je protizákonné a dotknutá osoba namieta proti vymazaniu OÚ a žiada namiesto toho obmedzenie ich použitia;</li>
                  <li>prevádzkovateľ už nepotrebuje OÚ na účely spracúvania OÚ, ale potrebuje ich dotknutá osoba na preukázanie, uplatňovanie alebo obhajovanie právnych nárokov;</li>
                  <li>dotknutá osoba namietala voči spracúvaniu podľa článku 21 ods. 1 Nariadenia, a to až do overenia, či oprávnené dôvody na strane Prevádzkovateľa prevažujú nad oprávnenými dôvodmi dotknutej osoby;</li>
                </ul>
              </div>

              <div>
                <p><strong>5) Právo podať návrh</strong></p>
                <p>Podať návrh na začatie konania na Úrade na ochranu OÚ SR;</p>
              </div>

              <div>
                <p><strong>6) Právo na prenosnosť</strong></p>
                <p>
                  Dotknutá osoba má právo získať OÚ, ktoré sa jej týkajú a ktoré poskytla Prevádzkovateľovi, v štruktúrovanom, bežne používanom a strojovo čitateľnom formáte a má právo preniesť tieto údaje ďalšiemu Prevádzkovateľovi bez toho, aby jej Prevádzkovateľ, ktorému sa tieto osobné údaje poskytli, bránil, ak (právo na prenosnosť):
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>sa spracúvanie zakladá na súhlase podľa článku 6 ods. 1 písm. a) alebo článku 9 ods. 2 písm. a), alebo na zmluve podľa článku 6 ods. 1 písm. b), a</li>
                  <li>ak sa spracúvanie vykonáva automatizovanými prostriedkami.</li>
                </ul>
                <p className="mt-2">
                  Dotknutá osoba má pri uplatňovaní svojho práva na prenosnosť údajov právo na prenos OÚ priamo od jedného Prevádzkovateľa druhému Prevádzkovateľovi, pokiaľ je to technicky možné.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Právo namietať proti spracúvaniu osobných údajov</h2>
            <p>
              Proti spracúvaniu Vašich osobných údajov, ktoré je založené na našich oprávnených záujmoch, môžete kedykoľvek namietať, aj bez uvedenia dôvodov. Námietku musíme riadne posúdiť. Ak nepreukážeme, že máme na spracúvanie Vašich osobných údajov nevyhnutné oprávnené dôvody a že tieto prevažujú nad Vašimi záujmami, právami a slobodami, nebudeme Vaše osobné údaje ďalej spracúvať.
            </p>
            
            <p className="mt-4">
              V prípade zasielania marketingových informácií na základe oprávneného záujmu, je možné sa odhlásiť z odoberania marketingových informácií:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>(i) prostredníctvom linku uvedeného v marketingovom e-maile;</li>
              <li>(ii) osobne v sídle Prevádzkovateľa;</li>
              <li>(iii) poštou na adresu Prevádzkovateľa;</li>
              <li>(iv) emailom na zodpovednú osobu gdpr@nitracik.sk;</li>
            </ul>

            <p className="mt-4">
              Vašu námietku môžete zaslať písomne na adresu Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901 alebo e-mailom na{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-blue-600 hover:underline">gdpr@nitracik.sk</a>.
            </p>
          </section>

          <section>
            <p>
              Žiadosti v súvislosti s vyššie uvedenými právami je dotknutá osoba oprávnená uplatniť u zodpovednej osoby na adrese{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-blue-600 hover:underline">gdpr@nitracik.sk</a>{' '}
              alebo formou doporučeného listu doručeného Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901. Do predmetu e-mailu aj listu je potrebné uviesť "Osobné údaje – UPLATŇOVANIE PRÁV DOTKNUTÝCH OSÔB".
            </p>
          </section>

          <section>
            <p>
              Odpovede na uvedené žiadosti dotknutej osoby alebo opatrenia prijaté na základe týchto žiadostí sa poskytujú bezodplatne. Ak je žiadosť dotknutej osoby zjavne neopodstatnená alebo neprimeraná, najmä pre jej opakujúcu sa povahu (opakovaná žiadosť), prevádzkovateľ má právo účtovať si poplatok zohľadňujúci jej administratívne náklady na poskytnutie informácií alebo primeraný poplatok zohľadňujúci jej administratívne náklady na oznámenie, resp. na uskutočnenie požadovaného opatrenia alebo má právo odmietnuť na základe takejto žiadosti konať.
            </p>
          </section>

          <section>
            <p>
              V prípade pochybností o dodržiavaní povinností súvisiacich so spracúvaním OÚ sa môžete obrátiť priamo na prevádzkovateľa, a to na zodpovednú osobu a adrese{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-blue-600 hover:underline">gdpr@nitracik.sk</a>. Zároveň máte možnosť obrátiť sa so sťažnosťou na Úrad na ochranu osobných údajov Slovenskej republiky, so sídlom Námestie 1. mája 18, 811 06 Bratislava, budova Park One, e-mail:{' '}
              <a href="mailto:statny.dozor@pdp.gov.sk" className="text-blue-600 hover:underline">statny.dozor@pdp.gov.sk</a>, www:{' '}
              <a href="https://dataprotection.gov.sk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://dataprotection.gov.sk/
              </a>.
            </p>
          </section>

          <section>
            <p>
              Aktuálna verzia tohto dokumentu sa nachádza na{' '}
              <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://nitracik.sk/
              </a>{' '}
              v časti „Ochrana osobných údajov".
            </p>
          </section>

          <section className="text-right text-gray-600 italic">
            <p>V Nitre dňa 18.02.2026.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RegistrationInfo;