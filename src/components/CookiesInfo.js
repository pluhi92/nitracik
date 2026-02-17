import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const CookiesInfo = () => {
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
          Podmienky a informácie o spracovávaní osobných údajov - Cookies https://nitracik.sk/
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
              Občianske združenie Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901, IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205 (ďalej len "občianske združenie" alebo "prevádzkovateľ" alebo „Nitráčik o.z.") ako prevádzkovateľ získava a spracúva osobné údaje dotknutých osôb, ktorým týmto poskytuje informácie v zmysle Nariadenia Európskeho parlamentu a Rady (EÚ) 2016/679 z 27.04.2016 o ochrane fyzických osôb pri spracúvaní osobných údajov a o voľnom pohybe takýchto údajov, ktorým sa zrušuje smernica 95/46/ES ("GDPR" alebo „Nariadenie").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Čo sú cookies?</h2>
            <p>
              Cookies sú malé textové súbory, ktoré váš internetový prehliadač uloží alebo načíta na pevnom disku vášho koncového zariadenia (napr. počítač, notebook alebo smartphone) prostredníctvom webových stránok, ktoré navštívite, pre účely uloženia určitých informácii alebo obrazových súborov, akými sú napr. pixely. Keď nabudúce navštívite našu webovú stránku na rovnakom zariadení, budú informácie o vašich cookies už uložené. Cookies sú odovzdané buď našej webovej stránke („vlastné cookies") alebo inej webovej stránke, ku ktorej cookies patria („externé cookies" alebo „cookies tretej strany"). V prípade, ak našu webovú stránku navštívite z iného zariadenia ako zariadenia, na ktorom ste už cookies nastavili alebo v prípade, ak nastane zmena v procese spracúvania cookies (napr. úprava lehoty, atď.) budete opätovne požiadaný o nastavenie vašich cookies na našej webovej stránke t. j. napríklad poskytnutie vášho súhlasu a/alebo nastavenie vašich preferencií.
            </p>
          </section>

          <section>
            <p>
              Cookies spracúvame na rôzne účely, ale primárne ich používame na to, aby sme vám boli schopní našu webovú stránku optimálnym spôsobom zobraziť, zabezpečiť riadne funkcionality našej webovej stránky v súlade s vašimi preferenciami. V prípade iných ako hore uvedených účelov budú vaše cookies ukladané iba s vaším súhlasom, prípadne na základe oprávneného záujmu.
            </p>
            <p className="mt-4">
              Súbory cookies môžete tiež zablokovať alebo odstrániť prostredníctvom internetového prehliadača.
            </p>
          </section>

          <section>
            <p>
              Z pohľadu ochrany osobných údajov (ďalej len: „OÚ" alebo osobný údaj") je dôležité posúdiť, aké údaje sú v konkrétnom súbore cookie obsiahnuté. V prípade, ak je súčasťou údajov zapísaných v súbore cookie akýkoľvek identifikátor, ktorý je samostatne alebo v spojení s inými údajmi spôsobilý priamo alebo nepriamo identifikovať fyzickú osobu – používateľa webového prehliadača, bude nutné takéto cookie považovať za OÚ v zmysle článku 4 ods. 1 GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Správa súhlasu s cookies</h2>
            <p>
              O súhlas s používaním cookies vás žiadame prostredníctvom našej cookie lišty, ktorej spravovanie a zrozumiteľnosť sme sa snažili prispôsobiť používateľom našej webovej stránky. Na úvodnej strane cookies lišty (prvá vrstva) vám poskytujeme stručné a základné informácie k spracúvaniu cookies na našej webovej stránke. Sú vám ponúknuté možnosti spravovania zberu cookies.
            </p>
            <p className="mt-4">
              Ak si však neželáte, aby došlo k používaniu všetkých cookies na našej webovej stránke, máte možnosť v rámci prvej vrstvy cookie lišty kliknúť na tlačidlo <strong>NASTAVIŤ COOKIES</strong>, ktoré vás presunie do druhej vrstvy našej cookie lišty. V rámci druhej vrstvy je možné oboznámiť s druhmi účelov a zvoliť si len tie účely na ktoré nám súhlas udelíte a kliknúť na tlačidlo <strong>ULOŽIŤ VÝBER</strong>, alebo jedným tlačidlom <strong>PRIJAŤ VŠETKY</strong> udeliť súhlas na všetky cookies nachádzajúce sa na našej webovej stránke, ale kliknúť na tlačidlo <strong>ODMIETNUŤ VŠETKY</strong> a vtedy budeme spracúvať iba nevyhnutné cookies. Veríme, že takýto manažment preferencií je pre každého používateľa našej webovej stránky vyhovujúci.
            </p>
            <p className="mt-4">
              V rámci prvej vrstvy cookie lišty máte možnosť kliknúť na tlačidlo <strong>ODMIETNUŤ VŠETKY</strong> a vtedy budeme spracúvať iba nevyhnutné cookies, alebo kliknúť na tlačidlo <strong>PRIJAŤ VŠETKY</strong> a udeliť nám súhlas, aby sme o vás spracúvali všetky cookies, ktoré sa nachádzajú na našej stránke.
            </p>
          </section>

          <section>
            <p>
              Podľa druhu vzťahu s prevádzkovateľom sú v tabuľke nižšie uvedené účely spracovania osobných údajov (ďalej len "OÚ") z ktorých je zrejmá kategória dotknutých osôb, právny základ na ich spracúvanie, kategórie spracúvaných OÚ ako aj doba, po ktorú bude prevádzkovateľ tieto OÚ spracovávať.
            </p>
          </section>

          <section>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Účel spracúvania osobných údajov</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Právny základ spracúvania osobných údajov</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Kategória dotknutých osôb</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Doba spracúvania OÚ</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Príjemcovia alebo kategória príjemcov</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>TECHNICKÉ COOKIES (NEVYHNUTNÉ)</strong><br/>
                      Účelom spracúvania osobných údajov je prenos alebo uľahčenie prenosu správy prostredníctvom siete, alebo ak je to bezpodmienečne potrebné pre prevádzkovateľa ako poskytovateľa služieb informačnej spoločnosti na poskytovanie služby informačnej spoločnosti, ktorú výslovne požaduje užívateľ
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      spracúvanie je v zmysle čl. 6 ods. 1 písm. f) Nariadenia – OPRÁVNENÝ ZÁUJEM, ktorý sleduje prevádzkovateľ a vyplývajúci mu z § 108 ods. 9 zákona č. 452/2021 Z. z. o elektronických komunikáciách<br/><br/>
                      Oprávneným záujmom je: technické uloženiu údajov alebo prístupu k nim, za účelom prenosu alebo uľahčenia prenosu správy prostredníctvom siete, alebo ak je to bezpodmienečne potrebné pre poskytovateľa služieb informačnej spoločnosti na poskytovanie služby informačnej spoločnosti, ktorú výslovne požaduje užívateľ.
                    </td>
                    <td className="border border-gray-300 px-4 py-2">Návštevníci webových stránok</td>
                    <td className="border border-gray-300 px-4 py-2">Konkrétne lehoty a účel jednotlivej cookie nájdete v druhej vrstve cookie lišty, po kliknutí na Technické cookies (Nevyhnutné)</td>
                    <td className="border border-gray-300 px-4 py-2">subjekty, ktorým prevádzkovateľ poskytuje osobné údaje na základe zákona; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti;</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>ANALYTICKÉ COOKIES</strong><br/>
                      Účelom spracúvania osobných údajov analytických cookies je umožniť prevádzkovateľovi rozpoznať a spočítať počet návštevníkov stránok a získať informácie o tom, ako sa webová stránka používa (napr. ktoré stránky najčastejšie otvára dotknutá osoba a či dotknutá osoba od niektorých stránok dostáva chybové hlásenia). To prevádzkovateľovi pomáha zlepšiť spôsob, akým funguje jej webová stránka, napríklad tým, že dotknutá osoba môže ľahko nájsť to, čo hľadá.
                    </td>
                    <td className="border border-gray-300 px-4 py-2">čl. 6 ods. 1 písm. a) GDPR – súhlas dotknutej osoby</td>
                    <td className="border border-gray-300 px-4 py-2">Návštevníci webových stránok</td>
                    <td className="border border-gray-300 px-4 py-2">Konkrétne lehoty a účel jednotlivej cookie nájdete v druhej vrstve cookie lišty, po kliknutí na Analytické cookies</td>
                    <td className="border border-gray-300 px-4 py-2">subjekty, ktorým prevádzkovateľ poskytuje osobné údaje na základe zákona; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti; spoločnosť Google poskytujúca Google Analytics t.z. analytické nástroje;</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>UPLATNENIE PRÁV DOTKNUTEJ OSOBY</strong><br/>
                      Účelom spracúvania OÚ je uplatňovanie práv dotknutých osôb podľa GDPR. (tento účel sa vzťahuje na prípady, keď dôjde k uplatneniu Vašich práv podľa GDPR)
                    </td>
                    <td className="border border-gray-300 px-4 py-2">spracúvanie je v zmysle čl. 6 ods. 1 písm. c) Nariadenia nevyhnutné na splnenie zákonnej povinnosti prevádzkovateľa vyplývajúcej z nariadenia a zo zákona č. 18/2018 Z. z.</td>
                    <td className="border border-gray-300 px-4 py-2">fyzické osoby uplatňujúce svoje práva ako dotknuté osoby</td>
                    <td className="border border-gray-300 px-4 py-2">5 rokov nasledujúcich po roku, v ktorom bola žiadosť vybavená</td>
                    <td className="border border-gray-300 px-4 py-2">subjekty, ktorým prevádzkovateľ poskytuje osobné údaje na základe zákona; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti; spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Osobitne k službám tretích strán, ktoré používame na analytické, štatistické účely</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Služba Google Analytics od spoločnosti Google</h3>
            <p>
              Webové stránky prevádzkovateľa využívajú na analytické a štatistický účely službu Google Analytics, t. j. webovú analytickú službu poskytovanú spoločnosťou Google. Služba Google Analytics používa súbory cookies na to, aby nám pomohla analyzovať spôsob využívania našej webovej stránky.
            </p>
            <p className="mt-4">
              Informácie vytvorené súborom cookies o používaní webových stránok (vrátane vašej IP adresy) budú prenesené a uložené spoločnosťou Google. Spoločnosť Google používa tieto informácie na účely hodnotenia vášho používania webovej stránky, zostavovania prehľadov o činnosti webových stránok pre prevádzkovateľov webových stránok a poskytovania ďalších služieb týkajúcich sa činnosti webových stránok a používania internetu. Spoločnosť Google môže tieto informácie poskytnúť aj tretím stranám, ak to vyžaduje zákon, alebo ak takéto tretie strany spracúvajú informácie v mene spoločnosti Google.
            </p>
            <p className="mt-4">
              Službu Google Analytics zabezpečuje spoločnosť: Google Dublin, Google Ireland Ltd, Gordon House, Barrow Street, Dublin 4, Írsko, Fax: +353 (1) 436 1001.
            </p>
            <p className="mt-4">
              Podmienky poskytovania služby Google Analytics sú dostupné tu:{' '}
              <a href="https://www.google.com/analytics/terms/gb.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.google.com/analytics/terms/gb.html
              </a>.
            </p>
            <p className="mt-4">
              Všeobecný prehľad o zásadách zabezpečenia a ochrany súkromia v Google Analytics je dostupný tu:{' '}
              <a href="https://support.google.com/analytics/answer/6004245?hl=sk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://support.google.com/analytics/answer/6004245?hl=sk
              </a>, a taktiež politika o ochrane súkromia spoločnosti Google je dostupná tu:{' '}
              <a href="https://policies.google.com/privacy?hl=sk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://policies.google.com/privacy?hl=sk
              </a>.
            </p>
            <p className="mt-4">
              Prosím vezmite na vedomie, že spoločnosť Google môže spracúvať OÚ aj v tretej krajine. Prenos do tretích krajín nie je teda v rámci tejto služby vylúčený. Pre prípad prenosu do tretích krajín sú ako vhodné záruky prijaté štandardné zmluvné doložky v súlade s článkom 46 Nariadenia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Všeobecne k spracúvaniu OÚ v súvislosti s COOKIES</h2>
            <p>
              Vezmite, prosím, na vedomie, že prevádzkovateľ využíva služby tretích strán, aby sa dozvedela o používaní jej webovej stránky s cieľom optimalizovať Vaše používateľské skúsenosti. Tieto tretie strany (vrátane napr. poskytovateľov externých služieb ako sú služby analýzy webovej prevádzky a i.) môžu tiež používať súbory cookies, nad ktorými nemáme žiadnu kontrolu.
            </p>
            <p className="mt-4">
              Súhlas so spracúvaním OÚ môžete kedykoľvek odvolať. Ak chcete odstrániť súbory cookies uložené vo Vašich zariadeniach a nakonfigurovať Váš webový prehliadač na odmietanie súborov cookies, môžete to urobiť pomocou nastavení predvolieb vášho webového prehliadača. Obvykle nájdete navigačné nastavenia týkajúce sa súborov cookies v ponukách "Možnosti", "Nástroje" alebo "Predvoľby" vo webovom prehliadači, ktorý používate na prístup k našej webovej stránke. V závislosti od existujúcich webových prehliadačov je možné vypnúť súbory cookies pomocou rôznych prostriedkov. Ak chcete získať viac informácií, navštívte príslušnú webovú stránku prehliadača.
            </p>
          </section>

          <section>
            <p>
              Prevádzkovateľ nesprístupňuje OÚ žiadnym tretím osobám ako tým, u ktorých to vyžaduje zákon alebo tieto podmienky spracúvania osobných údajov.
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
              Prevádzkovateľ nespracúva osobné údaje pre účely vykonávania automatizovaného rozhodovania, vrátane profilovania.
            </p>
          </section>

          <section>
            <p>
              V prípade, ak je právnym základom pre spracúvanie OÚ plnenie zákonnej povinnosti, poskytnutie týchto údajov je zákonnou požiadavkou. V prípade neposkytnutia týchto údajov, nie je možné zabezpečiť riadne plnenie povinností prevádzkovateľa, ktoré jej vyplývajú z príslušných všeobecných právnych predpisov.
            </p>
          </section>

          <section>
            <p>
              Ak OÚ poskytuje iná ako dotknutá osoba, daná osoba prehlasuje, že má právny základ na poskytnutie OÚ. OÚ o dotknutej osobe možno získať od inej fyzickej osoby a spracúvať v informačnom systéme len s predchádzajúcim písomným súhlasom dotknutej osoby; to neplatí, ak poskytnutím OÚ o dotknutej osobe do informačného systému iná fyzická osoba chráni svoje práva alebo právom chránené záujmy, oznamuje skutočnosti, ktoré odôvodňujú uplatnenie právnej zodpovednosti dotknutej osoby, alebo sa OÚ spracúvajú na základe osobitného zákona
            </p>
          </section>

          <section>
            <p>
              <strong>Zdroj:</strong> Vaše osobné údaje máme iba od Vás a prípadne ich vytvoril prevádzkovateľ ako napr. dátum návštevy stránky a zvolené preferencie.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Práva dotknutých osôb</h2>
            <p className="mb-3">V súvislosti so spracúvaním OÚ má dotknutá osoba najmä nasledovné práva:</p>
            
            <div className="space-y-4">
              <div>
                <p><strong>1) Právo na prístup k osobným údajom</strong></p>
                <p>
                  Na základe žiadosti vyžadovať od prevádzkovateľa právo na prístup k osobným údajom (právo na prístup), t. j. dotknutá osoba má právo získať od prevádzkovateľa potvrdenie o tom, či sa spracúvajú OÚ, ktoré sa jej týkajú, a ak tomu tak je, má právo získať prístup k týmto OÚ a tieto informácie:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>účely spracúvania;</li>
                  <li>kategórie dotknutých OÚ;</li>
                  <li>príjemcovia alebo kategórie príjemcov, ktorým boli alebo budú OÚ poskytnuté, najmä príjemcovia v tretích krajinách alebo medzinárodné organizácie;</li>
                  <li>ak je to možné, predpokladaná doba uchovávania osobných údajov alebo, ak to nie je možné, kritériá na jej určenie;</li>
                  <li>existencia práva požadovať od prevádzkovateľa opravu OÚ týkajúcich sa dotknutej osoby alebo ich vymazanie alebo obmedzenie spracúvania, alebo práva namietať proti takémuto spracúvaniu;</li>
                  <li>právo podať sťažnosť dozornému orgánu;</li>
                  <li>ak sa osobné údaje nezískali od dotknutej osoby, akékoľvek dostupné informácie, pokiaľ ide o ich zdroj;</li>
                  <li>existencia automatizovaného rozhodovania vrátane profilovania uvedeného v článku 22 ods. 1 a 4 GDPR a v týchto prípadoch aspoň zmysluplné informácie o použitom postupe, ako aj význame a predpokladaných dôsledkoch takéhoto spracúvania pre dotknutú osobu;</li>
                  <li>ak sa OÚ prenášajú do tretej krajiny alebo medzinárodnej organizácii, dotknutá osoba má právo byť informovaná o primeraných zárukách podľa článku 46 GDPR týkajúcich sa prenosu;</li>
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
                  <li>OÚ sa získavali v súvislosti s ponukou služieb informačnej spoločnosti podľa článku 8 ods. 1 GDPR;</li>
                </ul>
              </div>

              <div>
                <p><strong>4) Právo na obmedzenie spracúvania</strong></p>
                <p>Na základe žiadosti vyžadovať od prevádzkovateľa obmedzenie spracúvania OÚ (právo na obmedzenie spracúvania), ak:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>dotknutá osoba napadne správnosť OÚ, a to počas obdobia umožňujúceho prevádzkovateľovi overiť správnosť OÚ;</li>
                  <li>spracúvanie OÚ je protizákonné a dotknutá osoba namieta proti vymazaniu OÚ a žiada namiesto toho obmedzenie ich použitia;</li>
                  <li>prevádzkovateľ už nepotrebuje OÚ na účely spracúvania OÚ, ale potrebuje ich dotknutá osoba na preukázanie, uplatňovanie alebo obhajovanie právnych nárokov;</li>
                  <li>dotknutá osoba namietala voči spracúvaniu podľa článku 21 ods. 1 GDPR, a to až do overenia, či oprávnené dôvody na strane prevádzkovateľa prevažujú nad oprávnenými dôvodmi dotknutej osoby;</li>
                </ul>
              </div>

              <div>
                <p><strong>5) Právo na prenosnosť OÚ</strong></p>
                <p>
                  Na základe žiadosti vyžadovať od prevádzkovateľa OÚ, ktoré sa týkajú dotknutej osoby, a ktoré poskytla prevádzkovateľovi, v štruktúrovanom, bežne používanom a strojovo čitateľnom formáte a právo preniesť tieto údaje (právo na prenosnosť OÚ) ďalšiemu prevádzkovateľovi bez toho, aby jej prevádzkovateľ, ktorému sa tieto OÚ poskytli, bránil, ak:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>sa spracúvanie zakladá na súhlase podľa článku 6 ods. 1 písm. a) GDPR alebo článku 9 ods. 2 písm. a) GDPR, alebo na zmluve podľa článku 6 ods. 1 písm. b) GDPR, a</li>
                  <li>ak sa spracúvanie vykonáva automatizovanými prostriedkami.</li>
                </ul>
                <p className="mt-2">
                  Dotknutá osoba má pri uplatňovaní svojho práva na prenosnosť údajov podľa predchádzajúceho odseku právo na prenos osobných údajov priamo od jedného prevádzkovateľa druhému prevádzkovateľovi, pokiaľ je to technicky možné;
                </p>
              </div>

              <div>
                <p><strong>6) Právo podať návrh</strong></p>
                <p>Podať návrh na začatie konania na Úrade na ochranu osobných údajov SR;</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Právo odvolať súhlas so spracúvaním osobných údajov</h2>
            <p>
              Vaše odvolanie súhlasu môžete poslať osobne alebo poštou na Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901 alebo e-mailom na{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-blue-600 hover:underline">gdpr@nitracik.sk</a>.
            </p>
            <p className="mt-4">
              Ako sme spomínali vyššie Váš súhlas so spracúvaním osobných údajov môžete odvolať aj prostredníctvom cookie lišty. Ku cookie lište sa dostanete prostredníctvom kliknutia na tlačidlo (button) „Nastavenia cookies" na spodnej lište na webovej stránke{' '}
              <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://nitracik.sk/
              </a>, a tak môžete zmeniť svoje rozhodnutie, ktoré sa týka cookies (napr. odvolať súhlas). Súbory cookies môžete tiež zablokovať alebo odstrániť prostredníctvom internetového prehliadača.
            </p>
          </section>

          <section>
            <p>
              Podrobné informácie o jednotlivých právach dotknutých osôb a spôsobe ich uplatnenia sú uvedené na{' '}
              <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://nitracik.sk/
              </a>{' '}
              v časti Ochrana osobných údajov. Žiadosti v súvislosti s vyššie uvedenými právami je dotknutá osoba oprávnená uplatniť na adrese{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-blue-600 hover:underline">gdpr@nitracik.sk</a>, resp. formou doporučeného listu doručeného prevádzkovateľovi – jeho zodpovednej osobe, prípadne osobne v sídle prevádzkovateľa.
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
              <a href="mailto:gdpr@nitracik.sk" className="text-blue-600 hover:underline">gdpr@nitracik.sk</a>. Zároveň máte právo obrátiť sa so sťažnosťou na Úrad na ochranu osobných údajov Slovenskej republiky, so sídlom Budova Park one, Námestie 1. mája 18, 811 06 Bratislava, e-mail:{' '}
              <a href="mailto:statny.dozor@pdp.gov.sk" className="text-blue-600 hover:underline">statny.dozor@pdp.gov.sk</a>, www:{' '}
              <a href="https://dataprotection.gov.sk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://dataprotection.gov.sk/
              </a>.
            </p>
          </section>

          <section>
            <p>
              Aktuálna verzia tohto dokumentu sa nachádza aj v sídle prevádzkovateľa a na internetovej webovej stránke{' '}
              <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://nitracik.sk/
              </a>, v časti Ochrana osobných údajov.
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

export default CookiesInfo;