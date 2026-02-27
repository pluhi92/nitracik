import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const SocialNetworksInfo = () => {
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
          Podmienky a informácie o spracúvaní osobných údajov – SPRÁVA PROFILOV NA SOCIÁLNYCH SIEŤACH
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
              Občianske združenie Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901, IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205 (ďalej len "občianske združenie" alebo "prevádzkovateľ" alebo „Nitráčik o.z.").
            </p>
          </section>

          <section>
            <p>
              Podľa druhu zmluvného vzťahu s prevádzkovateľom sú v tabuľke nižšie uvedené účely spracovania osobných údajov (ďalej len „OÚ") z ktorých je zrejmá kategória dotknutých osôb, právny základ na ich spracovanie ako aj doba, po ktorú bude prevádzkovateľ tieto OÚ spracovávať.
            </p>
          </section>

          <section>
            <p>
              Podmienky a informácie o spracúvaní osobných údajov Nitráčik o.z. vysvetľujú len základné otázky týkajúce sa správy profilov Nitráčik o.z. má pri spracúvaní Vašich OÚ cez jej profily na sociálnych sieťach iba typické administrátorské oprávnenia. Pri používaní sociálnych sietí sú Vaše OÚ spracúvané aj zo strany poskytovateľov týchto sociálnych sietí (napr. Facebook, Instagram). Nad týmto spracúvaním, ďalším poskytovaním Vašich OÚ tretím stranám a nad ich cezhraničným prenosom do tretích krajín (ktoré vykonávajú daní poskytovatelia sociálnych sietí) nemáme spravidla žiadnu kontrolu a nezodpovedáme za ne. Odporúčame Vám oboznámiť sa s podmienkami ochrany súkromia poskytovateľov platforiem sociálnych médií, cez ktoré spolu komunikujeme. Za spracúvanie Vašich OÚ prostredníctvom sociálnych sietí zodpovedá Nitráčik o.z. iba v prípade, ak je do tohto spracúvania priamo zapojená ako spoločný prevádzkovateľ alebo ako prevádzkovateľ využívajúci služby sprostredkovateľa. Nitráčik o.z. zodpovedá iba za svoje vlastné marketingové aktivity a za vlastné kampane na svojich oficiálnych profiloch na sociálnych sieťach, ktoré vysvetľujú tieto podmienky ochrany súkromia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">FACEBOOK, INSTAGRAM A YOUTUBE:</h2>
            <p>
              OÚ pre sociálne siete Facebook, Instagram spracúva spoločnosť Meta Ltd., 4 Námestie Grand Canal, prístav Grand Canal, Dublin 2, Írsko (ďalej len „Facebook") tak, ako je to opísané v politike Facebooku na{' '}
              <a href="https://www.facebook.com/policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.facebook.com/policy
              </a>. Nitráčik o.z. by chcela zdôrazniť, že v tomto prípade môžu byť údaje užívateľov spracúvané aj mimo Európsku úniu. To môže mať za následok riziká pre užívateľa, pretože napr. vymáhanie práv užívateľov môže byť náročnejšie. Facebook sa však podriadil podmienkam ochrany súkromia EÚ - USA a súhlasí s tým, že bude dodržiavať normy EÚ na ochranu údajov (
              <a href="https://www.privacyshield.gov/participant?id=a2zt0000000GnywAAC&status=Active" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.privacyshield.gov/participant?id=a2zt0000000GnywAAC&status=Active
              </a>). V prípade ostatných poskytovateľov sociálnych sietí postupuje Nitráčik o.z. obdobne, a vždy si pre svoje oficiálne profily volí takú sociálnu sieť, ktorej prevádzkovateľ garantuje dodržiavanie noriem EÚ a dodržiavanie základných štandardov EÚ pre ochranu súkromia.
            </p>
          </section>

          <section>
            <p>Prevádzkovateľ má založené tieto fanpage prevádzkované spoločnosťou Facebook:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <a href="https://www.facebook.com/people/Nitr%C3%A1%C4%8Dik/61558994166250/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  https://www.facebook.com/people/Nitr%C3%A1%C4%8Dik/61558994166250/
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/nitracik" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  https://www.instagram.com/nitracik
                </a>
              </li>
            </ul>
          </section>

          <section>
            <p>
              Pokiaľ nie je v týchto podmienkach uvedené inak, pre účel „sociálne siete – správa profilov" v zásade platí, že Nitráčik o.z. je voči prevádzkovateľom sociálnych sietí postavení osobitného prevádzkovateľa a prevádzkovateľ sociálnych sietí v postavení osobitného prevádzkovateľa.
            </p>
          </section>

          <section>
            <p>
              Odlišne od vyššie uvedeného je Nitráčik o.z. voči prevádzkovateľovi sociálnej siete Facebook pre účel „sociálne siete – správa profilov" v postavení prevádzkovateľa a prevádzkovateľ sociálnych sietí v postavení sprostredkovateľa Nitráčik o.z. V rámci tohto účelu môže Nitráčik o.z. využívať služby poskytované spoločnosťou Facebook, ktoré sú označené ako „data file custom audiences" – t. j. správa publika pre realizovanie reklamných kampaní, pričom v takomto prípade môže dochádzať k spájaniu OÚ spracúvaných Nitráčik o.z. s OÚ spracúvanými v databázach Facebooku a tiež služby označené ako „measurement and analytics" – t. j. služby v rámci ktorých Facebook spracúva OÚ v mene Nitráčik o.z. s cieľom merať výkonnosť a dosah reklamných kampaní Nitráčik o.z. a poskytuje Nitráčik o.z. prehľady používateľov, ktorí videli a reagovali na reklamný obsah Nitráčik o.z. umiestnený na Facebookových profiloch Nitráčik o.z. K tomuto spracúvaniu OÚ užívateľov môže dôjsť v prípade, ak užívateľ v rámci používania používateľského profilu zriadeného na Facebooku bude vykonávať interakcie s reklamným obsahom Nitráčik o.z. alebo s webstránkami Nitráčik o.z. V oboch týchto prípadoch využíva Nitráčik o.z. spoločnosť Facebook ako sprostredkovateľa, pričom sa na spracúvanie OÚ užívateľov sa v takomto prípade uplatňujú nasledovné právne záruky:{' '}
              <a href="https://www.facebook.com/legal/terms/businesstools" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.facebook.com/legal/terms/businesstools
              </a>,{' '}
              <a href="https://www.facebook.com/legal/terms/dataprocessing" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.facebook.com/legal/terms/dataprocessing
              </a>.
            </p>
          </section>

          <section>
            <p>
              Pre účel „sociálne siete – štatistické údaje" je Nitráčik o.z. spoločným prevádzkovateľom so spoločnosťou Facebook. V rámci tohto účelu môže Nitráčik o.z. údaje o užívateľoch a o ich správaní na sociálnych sieťach získané prostredníctvom poskytovateľov sociálnych sietí Facebook a Instagram spracúvať na účely prieskumu trhu a reklamy. Napr. zo správania užívateľov sociálnych sietí sa pri ich používaní vytvárajú tzv. profily použitia, v ktorých sa ukladajú záujmy užívateľov, a to bez ohľadu na zariadenia používané užívateľmi. Profily použitia sa môžu následne využívať pri ponuke a zobrazovaní reklám danému užívateľovi, tzv. personalizovaná reklama. Na tieto účely sa ukladajú v počítačoch užívateľov aj tzv. cookies, v ktorých je uložené užívateľské správanie a záujmy daného užívateľa. V rámci účelu „sociálne siete – štatistické údaje" Facebook poskytuje Nitráčik o.z. ako majiteľovi a správcovi jeho oficiálnych profilov na sociálnych sieťach (tzv. fanpage) štatistiku a informácie v takom rozsahu že ich je možne považovať za OÚ, nakoľko tieto pomáhajú Nitráčik o.z. získavať prehľad o druhoch akcií, ktoré užívatelia na svojich stránkach vykonávajú (ďalej len „Informácie o stránke"). Za účelom zbierania a spracúvania štatistických údajov je Nitráčik o.z. so spoločnosťou Facebook spoločnými prevádzkovateľmi, pričom OÚ získané na tieto účely sú spracúvané na základe dohody spoločných prevádzkovateľov medzi Nitráčik o.z. a Facebookom. Dohoda je dostupná tu:{' '}
              <a href="https://www.facebook.com/legal/terms/page_controller_addendum" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.facebook.com/legal/terms/page_controller_addendum
              </a>{' '}
              a tu{' '}
              <a href="https://sk-sk.facebook.com/help/instagram/155833707900388" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://sk-sk.facebook.com/help/instagram/155833707900388
              </a>.
            </p>
          </section>

          <section>
            <p>
              Informácie o tom, ako máte postupovať v prípade uplatnenia práva dotknutej osoby a ďalšie informácie o podmienkach spracúvania osobných údajov, sú uvedené v informáciách Facebooku, Instagramu na:{' '}
              <a href="https://www.facebook.com/about/privacy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.facebook.com/about/privacy/
              </a>, opt-out:{' '}
              <a href="https://www.facebook.com/settings?tab=ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.facebook.com/settings?tab=ads
              </a>,{' '}
              <a href="https://help.instagram.com/581066165581870?ref=dp" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://help.instagram.com/581066165581870?ref=dp
              </a>{' '}
              a{' '}
              <a href="https://privacycenter.instagram.com/policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://privacycenter.instagram.com/policy/
              </a>. V prípade ostatných poskytovateľov sociálnych sietí sú obdobné údaje uvedené vždy priamo na ich stránke v sekcii základných dokumentov, ktoré sú označené napr. ako „Ochrana súkromia" alebo „Cookies".
            </p>
          </section>

          <section>
            <p>
              V prípade ostatných poskytovateľov sociálnych sietí sú obdobné údaje uvedené vždy priamo na ich stránke v sekcii základných dokumentov, ktoré sú označené napr. ako „Ochrana súkromia" alebo „Cookies".
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
                    <td className="border border-gray-300 px-4 py-2">1. registrovaní prihlásení užívatelia, registrovaní neprihlásení užívatelia a neregistrovaní užívatelia</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>SOCIÁLNE SIETE – SPRÁVA PROFILOV NA SOCIÁLNYCH SIEŤACH VRÁTANE KOMUNIKÁCIE A DISKUSIE S UŽÍVATEĽMI (FIREMNÝ PROFIL TZV. FANPAGE NA FACEBOOKU, INSTAGRAME)</strong><br/><br/>
                      Účelom spracúvania osobných údajov je propagácia (priamy i nepriamy marketing) a ponuka služieb Nitráčik o.z. na sociálnych sieťach, komunikácia s užívateľmi, propagácia súťaží a sprievodných aktivít prostredníctvom sociálnych sietí, poskytovanie informácií širšej verejnosti
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      čl. 6 ods. 1 písm. f) Nariadenia – OPRÁVNENÝ ZÁUJEM<br/><br/>
                      Oprávneným záujmom je: vytvorenie oficiálneho profilu Nitráčik o.z. na príslušnej sociálnej sieti (tzv. fanpage). Oprávneným záujmom je propagácia (priamy i nepriamy marketing) a ponuka služieb Nitráčik o.z. na sociálnych sieťach, komunikácia s užívateľmi, organizovanie súťaží a sprievodných aktivít prostredníctvom sociálnych sietí, poskytovanie informácií širšej verejnosti.
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      Údaje sa uchovávajú (a) do času, keď už nie sú potrebné na poskytovanie služieb a produktov prevádzkovateľa danej sociálnej siete; alebo (b) pokým užívateľ neodstráni svoj účet; a to podľa toho, čo nastane skôr.<br/><br/>
                      Toto je vecou konkrétneho prípadu a závisí to napr. od charakteru údajov; od dôvodu, prečo sú zhromažďované a spracúvané; a od relevantných právnych alebo prevádzkových potrieb uchovávania. Napr. profilové informácie, fotky, ktoré užívateľ uverejnil (a neodstránil), a informácie o zabezpečení uchováva Facebook počas celej životnosti účtu. Pokiaľ niečo hľadáte na Facebooku, uchováva históriu hľadania dovtedy, kým užívateľ nevymaže hľadanie zo svojho záznamu o činnosti alebo neodstráni svoj účet. Potom, ako vymažete hľadanie alebo odstránite svoj účet, tieto informácie už nebudú pre užívateľa viditeľné a odstránia sa.<br/><br/>
                      Lehotu uchovávania v prípade Instagramu, Facebooku nájdete na: https://privacycenter.instagram.com/policy/.
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      odborní konzultanti a poradcovia ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti; subjekty, ktorým prevádzkovateľ poskytuje OÚ na základe zákona; V prípade služieb „data file custom audiences" a „measurement and analytics" je prevádzkovateľ sociálnej siete Facebook voči Nitráčik o.z. v postavení jej sprostredkovateľa;
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">2. registrovaní prihlásení užívatelia, registrovaní neprihlásení užívatelia a neregistrovaní užívatelia</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>AGENDA FACEBOOK a INSTAGRAM – ŠTATISTICKÉ ÚČELY</strong><br/><br/>
                      Účelom spracúvania osobných údajov je sledovanie štatistických informácií spojených s profilom prevádzkovateľa na danej sociálnej sieti. Štatistické informácie sú spojené so správou profilu na sociálnej sieti Facebook a Instagram a sú vlastníkovi profilu automaticke dostupné. Prevádzkovateľ údaje o užívateľoch a o ich správaní na sociálnych sieťach získané prostredníctvom poskytovateľa sociálnych sietí Facebook a Instagram spracúva na štatistické účely spojené so základným účelom existencie profilu prevádzkovateľa, t.j. zvyšovania povedomia o aktivitách prevádzkovateľa.<br/><br/>
                      Pre bližšie vysvetlenie odkazujeme na recitál 50 GDPR, podľa ktorého „spracúvanie OÚ na iné účely ako na účely, na ktoré boli OÚ pôvodne získané, by malo byť umožnené len vtedy, ak je toto spracúvanie zlučiteľné s účelmi, na ktoré boli OÚ pôvodne získané. V takom prípade sa nevyžaduje žiadny iný samostatný právny základ, než je právny základ, ktorý umožňoval získavanie OÚ. Ďalšie spracúvanie na štatistické účely by sa malo považovať za zlučiteľné so zákonnými spracovateľskými operáciami."
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      čl. 6 ods. 1 písm. f) Nariadenia – OPRÁVNENÝ ZÁUJEM<br/><br/>
                      Oprávneným záujmom spoločných prevádzkovateľov spoločnosti Facebook a Nitráčik o.z. je: získanie OÚ na základe právneho základu pôvodného účelu a ich následné spracúvanie na štatistické účely pre používanie sietí Facebook a Instagram v zmysle režimu podľa čl. 89 GDPR. Oprávneným záujmom je získanie, tzn. spracúvanie viacerých údajov, najmä demografických údajov cieľovej skupiny ako údaje týkajúce sa veku, pohlavia, rodinného stavu, povolania, životného štýlu a záujmov návštevníkov fanúšikovskej stránky, ako aj informácie ohľadom ich internetových nákupov a kategórií nakupovaných výrobkov a služieb, alebo geografických údajov. Nitráčik o.z. nastavila parametre okrem iného podľa svojej cieľovej skupiny, ako aj cieľov riadenia alebo podpory svojich činností, čo má vplyv na spracúvanie OÚ na účely vypracovania štatistík získaných na základe návštev fanúšikovskej stránky. Nitráčik o.z. môže v prípade Facebooku a Instagramu pomocou filtrov, ktoré jej poskytuje spoločnosť Facebook, vymedziť kritériá, na základe ktorých majú byť tieto štatistiky vypracované a tiež vymedziť kategórie osôb, ktorých OÚ budú využívané spoločnosťou Facebook. Nitráčik o.z. ako majiteľ a správca fanpage umiestnenej na Facebooku a Instagrame preto prispievajú k spracúvaniu OU návštevníkov svojej stránky. Všetky tieto informácie umožňujú Nitráčik o.z. napr. zistiť profil návštevníkov, ktorí kladne hodnotia jej fanpage, alebo ktorí využívajú jej aplikácie, s cieľom ponúknuť im relevantnejší obsah a rozvinúť funkcie, o ktoré by títo návštevníci mohli mať väčší záujem.
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      Údaje sa uchovávajú do času, keď už nie sú potrebné na poskytovanie služieb a produktov prevádzkovateľa danej sociálnej siete, alebo pokým užívateľ neodstráni svoj účet – podľa toho, čo nastane skôr.<br/><br/>
                      Toto je vecou konkrétneho prípadu a závisí to napr. od charakteru údajov; od dôvodu, prečo sú zhromažďované a spracúvané; a od relevantných právnych alebo prevádzkových potrieb uchovávania.<br/><br/>
                      https://privacycenter.instagram.com/policy
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      subjekty, ktorým prevádzkovateľ poskytuje OÚ na základe zákona, spoločnosti zabezpečujúce správu profilov na sociálnych sieťach; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti;
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">3. fyzické osoby uplatňujúce svoje práva ako dotknuté osoby</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>UPLATNENIE PRÁV DOTKNUTEJ OSOBY</strong><br/>
                      Účelom spracúvania OÚ je uplatňovanie práv dotknutých osôb podľa GDPR. (tento účel sa vzťahuje na prípady, keď dôjde k uplatneniu Vašich práv podľa GDPR)
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      spracúvanie je v zmysle čl. 6 ods. 1 písm. c) Nariadenia nevyhnutné na splnenie zákonnej povinnosti prevádzkovateľa vyplývajúcej z nariadenia a zo zákona č. 18/2018 Z. z.
                    </td>
                    <td className="border border-gray-300 px-4 py-2">5 rokov nasledujúcich po roku, v ktorom bola žiadosť vybavená</td>
                    <td className="border border-gray-300 px-4 py-2">
                      subjekty, ktorým prevádzkovateľ poskytuje osobné údaje na základe zákona; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti; spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby;
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">4. Strany sporu, účastníci konania a ďalšie zúčastnené osoby</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <strong>AGENDA VYBAVOVANIA SÚDNYCH SPOROV, EXEKÚCIÍ, VYMÁHANIE POHĽADÁVOK</strong><br/>
                      Účelom spracúvania OÚ je vybavovanie súdnych sporov, exekúcií a vymáhania pohľadávok.
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      čl. 6 ods. 1 písm. c) Nariadenia - nevyhnutné na splnenie ZÁKONNÝCH POVINNOSTÍ prevádzkovateľa vyplývajúcich zo zák. č. 160/2015 Z. z., zák. č. 244/2002 Z. z., zák. č. 301/2005 Z. z., zák. č. 7/2005 Z. z., zák. č. 38/1993 Z. z., zák. č. 162/2015 Z. z., zák. č. 233/1995 Z. z. a súvisiacich právnych predpisov
                    </td>
                    <td className="border border-gray-300 px-4 py-2">10 rokov po právoplatnom skočení príslušného konania</td>
                    <td className="border border-gray-300 px-4 py-2">
                      súdy, exekútori, advokáti a iné orgány verejnej správy a subjekty, ktorým Prevádzkovateľ poskytuje OÚ na základe zákona, odborní konzultanti a poradcovia ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prenos do tretích krajín</h2>
            <p>
              Nitráčik o.z. neuskutočňuje osobne prenos OÚ do tretích krajín (mimo Európskej únie/Európskeho hospodárskeho priestoru), prenos však môže vykonávať poskytovateľ konkrétnej sociálnej siete.
            </p>
            <p className="mt-4">
              Facebook/Meta má uvedené, do ktorých tretích krajín sa vykonáva prenos, tu:{' '}
              <a href="https://about.fb.com/news/2021/03/steps-we-take-to-transfer-data-securely/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://about.fb.com/news/2021/03/steps-we-take-to-transfer-data-securely/
              </a>{' '}
              a tu:{' '}
              <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.facebook.com/privacy/policy
              </a>. Ide o krajiny, kde sa prenášajú osobné údaje na základe Rozhodnutia o primeranosti Európskej komisie a to Argentína, Izrael, Nový Zéland, Švajčiarsko a Spojené kráľovstvo. V prípade prenosu do USA je spoločnosť certifikovaná Data Privacy Framework (
              <a href="https://www.facebook.com/privacy/policies/data_privacy_framework/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.facebook.com/privacy/policies/data_privacy_framework/
              </a>), v prípade zvyšných tretích krajín má Facebook uzatvorené štandardné zmluvné doložky{' '}
              <a href="https://www.facebook.com/help/566994660333381?ref=dp" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.facebook.com/help/566994660333381?ref=dp
              </a>.
            </p>
            <p className="mt-4">
              Štandardné zmluvné doložky schválené rozhodnutím Európskej komisie (2010/87/EC z 5. februára 2010) a nové štandardné zmluvné doložky (modul 3) vložené do Európskeho dodatku spoločnosti Facebook k prenosom údajov ako aj doplňujúce opatrenia/{' '}
              <a href="https://www.facebook.com/legal/EU_data_transfer_addendum" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.facebook.com/legal/EU_data_transfer_addendum
              </a>{' '}
              vysvetlené tu:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Vysvetlenie štandardných zmluvných doložiek/{' '}
                <a href="https://www.facebook.com/help/566994660333381" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  https://www.facebook.com/help/566994660333381
                </a>
              </li>
              <li>
                Vysvetlenie prijatých doplňujúcich opatrení/{' '}
                <a href="https://about.fb.com/news/2021/03/steps-we-take-to-transfer-data-securely/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  https://about.fb.com/news/2021/03/steps-we-take-to-transfer-data-securely/
                </a>
              </li>
              <li>
                Informácie pre orgány presadzovania práva/{' '}
                <a href="https://about.meta.com/actions/safety" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  https://about.meta.com/actions/safety
                </a>
              </li>
              <li>
                Informácie o žiadostiach orgánov presadzovania práva k zákazníckym dátam/{' '}
                <a href="https://transparency.meta.com/reports/government-data-requests/?source=https%3A%2F%2Ftransparency.facebook.com%2Fgovernment-data-requests%2Fgov-additional-information" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                  https://transparency.meta.com/reports/government-data-requests/...
                </a>
              </li>
            </ul>
            <p className="mt-4">
              Nástroje prenosu podľa čl. 45 GDPR sa vzťahujú na spoločnosť Facebook/Meta. Zápis dovozcu údajov v EU-US Data Privacy Framework je možné overiť tu:{' '}
              <a href="https://www.dataprivacyframework.gov/s/participant-search/participant-detail?id=a2zt000000001L5AAI&status=Active" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                https://www.dataprivacyframework.gov/s/participant-search/participant-detail?id=a2zt000000001L5AAI&status=Active
              </a>. Rozhodnutie Európskej komisie k EU-US Data Privacy Framework_{' '}
              <a href="https://commission.europa.eu/system/files/2023-07/Adequacy%20decision%20EU-US%20Data%20Privacy%20Framework_en.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                https://commission.europa.eu/system/files/2023-07/Adequacy%20decision%20EU-US%20Data%20Privacy%20Framework_en.pdf
              </a>
            </p>
          </section>

          <section>
            <p>
              Nitráčik o.z. nespracúva osobné údaje na účely vykonávania automatizovaného rozhodovania, vrátane profilovania.
            </p>
          </section>

          <section>
            <p>
              V prípade, ak je právnym základom pre spracúvanie OÚ zákon, poskytnutie týchto údajov je zákonnou požiadavkou. V prípade neposkytnutia týchto údajov, nie je možné zabezpečiť riadne plnenie povinností Nitráčik o.z., ktoré jej vyplývajú z príslušných všeobecných právnych predpisov.
            </p>
          </section>

          <section>
            <p>
              Nitráčik o.z. získava OÚ v prvom rade od dotknutých osôb alebo ich Nitráčik o.z. môže poskytnúť iný užívateľ. Ide o osobné údaje, ktoré sú zverejnené na fanpage prevádzkovateľa, a to najmä nick, meno, priezvisko, fotografia, osobné údaje zverejnené v príspevku a podobne.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Práva dotknutých osôb</h2>
            <p className="mb-3">V súvislosti so spracovávaním osobných údajov má dotknutá osoba najmä nasledovné práva:</p>
            
            <div className="space-y-4">
              <div>
                <p><strong>1) Právo na prístup</strong></p>
                <p>Na základe žiadosti vyžadovať od spoločnosti Nitráčik o.z. potvrdenie, či sú alebo nie sú jej osobné spracúvané (prístup k osobným údajom), za akých podmienok, vrátane rozsahu, účelu a doby ich spracúvania, a informácie o zdroji získania dotknutých osobných údajov;</p>
              </div>

              <div>
                <p><strong>2) Právo na opravu</strong></p>
                <p>Na základe žiadosti vyžadovať od spoločnosti Nitráčik o.z. opravu nesprávnych alebo neaktuálnych osobných údajov, resp. doplnenie neúplných osobných údajov;</p>
              </div>

              <div>
                <p><strong>3) Právo na výmaz</strong></p>
                <p>Na základe žiadosti vyžadovať od spoločnosti Nitráčik o.z. vymazanie/likvidáciu osobných údajov ak:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>osobné údaje už nie sú potrebné na účel, na ktorý sa získali alebo inak spracúvali,</li>
                  <li>v prípadoch, kedy boli osobné údaje spracovávané na základe súhlasu a tento súhlas so spracúvaním osobných údajov bol odvolaný, pričom neexistuje iný právný základ na spracúvanie osobných údajov alebo iná zákonná výnimka;</li>
                  <li>ak dotknutá osoba namieta spracúvanie osobných údajov na základe oprávneného záujmu a neprevažujú žiadne oprávnené dôvody na spracúvanie alebo dotknutá osoba namieta voči priamemu marketingu;</li>
                  <li>osobné údaje sú spracúvané nezákonne;</li>
                  <li>na to, aby sa splnila zákonná povinnosť, musia byť osobné údaje vymazané;</li>
                </ul>
              </div>

              <div>
                <p><strong>4) Právo na obmedzenie spracúvania</strong></p>
                <p>Na základe žiadosti vyžadovať od spoločnosti Nitráčik o.z. obmedzenie spracúvania osobných údajov ak:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>dotknutá osoba namieta správnosť osobných údajov, a to počas obdobia umožňujúceho spoločnosti Nitráčik o.z. overiť správnosť osobných údajov;</li>
                  <li>spracúvanie osobných údajov je nezákonné a dotknutá osoba namieta vymazanie osobných údajov a žiada namiesto toho obmedzenie ich použitia;</li>
                  <li>spoločnosť Nitráčik o.z. už nepotrebuje osobné údaje na účel spracúvania osobných údajov, ale potrebuje ich dotknutá osoba na uplatnenie právneho nároku;</li>
                </ul>
              </div>

              <div>
                <p><strong>5) Právo podať návrh</strong></p>
                <p>Podať návrh na začatie konania na Úrade na ochranu osobných údajov SR.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Právo namietať proti spracúvaniu osobných údajov</h2>
            <p>
              Proti spracúvaniu Vašich osobných údajov, ktoré je založené na našich oprávnených záujmoch, môžete kedykoľvek namietať, aj bez uvedenia dôvodov. Námietku musíme riadne posúdiť. Ak nepreukážeme, že máme na spracúvanie Vašich osobných údajov nevyhnutné oprávnené dôvody a že tieto prevažujú nad Vašimi záujmami, právami a slobodami, nebudeme Vaše osobné údaje ďalej spracúvať.
            </p>
            <p className="mt-4">
              Vašu námietku môžete zaslať písomne na adresu: Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901 alebo e-mailom na{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-blue-600 hover:underline">gdpr@nitracik.sk</a>.
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

export default SocialNetworksInfo;