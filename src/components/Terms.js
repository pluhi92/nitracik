import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  const [isAttachmentOneOpen, setIsAttachmentOneOpen] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);

  const faqItems = [
    {
      question: 'Ako funguje rezervácia?',
      answer: 'Rezervácia prebieha výhradne online po prihlásení do účtu. Miesto je potvrdené až po zaplatení kartou.'
    },
    {
      question: 'Môžem rezerváciu zrušiť?',
      answer: 'Áno, viac ako 10 hodín pred začiatkom tréningu. Vybrať si môžete refundáciu alebo kredit.'
    },
    {
      question: 'Čo ak sa tréningu nemôžeme zúčastniť na poslednú chvíľu?',
      answer: 'Menej ako 10 hodín pred začiatkom už storno nie je možné.'
    },
    {
      question: 'Je messy play bezpečné?',
      answer: 'Áno, ak je dieťa neustále pod dohľadom rodiča. Program vedie inštruktor, nie individuálny dozor.'
    },
    {
      question: 'Čo si máme obliecť?',
      answer: 'Oblečenie, ktoré sa môže zašpiniť. Neodporúčame sviatočné kúsky.'
    },
    {
      question: 'Ako je to s alergiami?',
      answer: 'Ak má dieťa alergiu alebo intoleranciu, zodpovednosť za jeho účasť nesie rodič.'
    },
    {
      question: 'Môžu sa robiť fotky?',
      answer: 'Áno, len ak s tým výslovne súhlasíte pri rezervácii.'
    }
  ];

  const toggleAttachment = () => {
    setIsAttachmentOpen(!isAttachmentOpen);
  };

  const toggleAttachmentOne = () => {
    setIsAttachmentOneOpen(!isAttachmentOneOpen);
  };

  // Prejdenie na vrch stránky pri načítaní
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center border-b pb-4">
          VŠEOBECNÉ OBCHODNÉ PODMIENKY (VOP)
        </h1>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          
          {/* Článok 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 1 Úvodné ustanovenia</h2>
            <p className="mb-2">
              1.1 Tieto Všeobecné obchodné podmienky (ďalej len „VOP“) upravujú práva a povinnosti medzi <strong>Nitráčik o.z.</strong> ako poskytovateľom služieb ďalej uvedených v týchto VOP (ďalej len „prevádzkovateľ“) a fyzickou osobou – spotrebiteľom (ďalej len „zákazník“ alebo „účastník“), ktorá prostredníctvom webovej stránky nitracik.sk (ďalej len „web“) využíva rezervačný systém na objednanie tréningov, workshopov alebo senzorických hier („Messy & sensory play“ alebo „služby“).
            </p>
            <div className="mb-2">
              1.2 Prevádzkovateľ:
              <ul className="list-disc pl-6 mt-1 space-y-1">
                <li>Obchodné meno: Nitráčik o.z.</li>
                <li>Sídlo: Hydinárska 13A Nitra 94901</li>
                <li>IČO: 56374453</li>
                <li>DIČ: 2122328791 – registrované Okresným úradom Nitra pod č. VVS/1-900/90-70205</li>
                <li>Kontaktný e-mail: <a href="mailto:info@nitracik.sk" className="text-blue-600 hover:underline">info@nitracik.sk</a></li>
                <li>Telefónne číslo: +421 949 584 576</li>
                <li>Orgán dozoru: Slovenská obchodná inšpekcia, Inšpektorát SOI pre Nitriansky kraj, odbor výkonu dohľadu, Staničná 9, P.O.BOX 49A, 950 50 Nitra.</li>
              </ul>
              Miestom poskytovania služieb je sídlo prevádzkovateľa.
            </div>
            <p className="mb-2">
              1.3 Tieto VOP sú neoddeliteľnou súčasťou zmluvy o poskytnutí služby uzatvorenej na diaľku podľa § 52 a nasl. Občianskeho zákonníka a zákona č. 108/2024 Z.z. o ochrane spotrebiteľa.
            </p>
            <p>
              1.4 Zákazník s týmito VOP vyjadruje výslovný súhlas pri objednávke služieb alebo zakúpení permanentky.
            </p>
          </section>

          {/* Článok 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 2 Užívateľský účet a registrácia</h2>
            <p className="mb-2">2.1 Rezervácia služieb je možná výhradne prostredníctvom registrovaného užívateľského účtu, ktorý je dostupný na webe. Užívateľský účet slúži na evidenciu rezervácií, komunikáciu so zákazníkom a zabezpečenie riadneho a bezpečného poskytovania služieb pre deti.</p>
            <p className="mb-2">2.2 Registrácia a vedenie účtu je bezplatné. Zákazník je povinný uvádzať pravdivé, aktuálne a úplné údaje.</p>
            <p className="mb-2">2.3 Užívateľský účet je zabezpečený prihlasovacími údajmi (e-mail a heslo). Zákazník je povinný tieto údaje chrániť a nezdieľať ich s tretími osobami.</p>
            <p className="mb-2">2.4 Prevádzkovateľ nenesie zodpovednosť za zneužitie účtu v prípade porušenia povinností zákazníka.</p>
            <p className="mb-2">2.5 Zákazník má právo kedykoľvek požiadať o zrušenie svojho užívateľského účtu prostredníctvom funkcionality dostupnej v užívateľskom profile alebo písomne na kontaktný e-mail prevádzkovateľa.</p>
            <p className="mb-2">2.6 Zrušením užívateľského účtu dochádza k trvalému vymazaniu osobných údajov zákazníka zo systému prevádzkovateľa (najmä meno, priezvisko, e-mail, telefónne číslo, adresa, ak boli poskytnuté), s výnimkou údajov, ktoré je prevádzkovateľ povinný uchovávať podľa osobitných právnych predpisov.</p>
            <p>2.7 O úspešnom zrušení užívateľského účtu a vymazaní osobných údajov bude zákazník informovaný prostredníctvom e-mailu.</p>
          </section>

          {/* Článok 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 3 Objednávka služieb a uzatvorenie zmluvy</h2>
            <p className="mb-2">3.1 Spôsobom objednávania služieb je rezervácia služby prostredníctvom registrovaného užívateľského účtu dostupného na webe v rezervačnom systéme. Zákazník si vyberá službu z ponuky služieb zverejnenej v rezervačnom systéme dostupnom po prihlásení sa do svojho užívateľského účtu.</p>
            <p className="mb-2">3.2 Rezerváciou konkrétneho termínu služby, úspešným spracovaním platby prostredníctvom platobnej brány Stripe, resp. odpísaním vstupu zo zakúpenej permanentky, vzniká zmluva o poskytnutí služby súvisiacej s činnosťami v rámci voľného času, ktorá je viazaná na konkrétny termín. Po vykonaní úspešnej rezervácie bude zákazníkovi doručený potvrdzujúci e-mail.</p>
            <p className="mb-2">3.3 Rezervácia je viazaná na konkrétny termín, typ tréningu a počet detí, pričom prevádzkovateľ si vyhradzuje právo službu zrušiť v prípade, že nebude prihlásený minimálny počet zákazníkov na daný termín. V prípade neuskutočnenia služby z dôvodu nenaplnenia kapacity bude zákazníkovi vrátená platba alebo poskytnutý náhradný termín.</p>
            <p className="mb-2">3.4 Prevádzkovateľ si vyhradzuje právo odmietnuť účasť osobám, ktoré nie sú uvedené v rezervácii alebo by prekročili kapacitné limity priestoru.</p>
            <p>3.5 V súlade s § 19 ods. 1 písm. l) zákona č. 108/2024 Z.z. o ochrane spotrebiteľa nemá zákazník právo na odstúpenie od zmluvy o poskytnutí služby súvisiacej s činnosťami v rámci voľného času uzatvorenej podľa bodu 3.2 tohto článku VOP, nakoľko ide o poskytnutie služby v presne dohodnutom čase.</p>
          </section>

          {/* Článok 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 4 Platobné podmienky</h2>
            <p className="mb-2">4.1 Ceny za jednotlivé aktivity sú konečné a uvedené priamo v rezervačnom systéme.</p>
            <p className="mb-2">4.2 Platba je možná výhradne online platobnou kartou prostredníctvom Stripe.</p>
            <p className="mb-2">4.3 Platba na mieste nie je možná.</p>
            <p>4.4 Prevádzkovateľ neuchováva platobné údaje zákazníkov; spracovanie platieb zabezpečuje Stripe ako samostatný prevádzkovateľ platobnej služby.</p>
          </section>

          {/* Článok 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 5 Permanentky</h2>
            <p className="mb-2">5.1 Na aktivitu „Ufúľané senzorické hry“ si Zákazník môže na webe po registrácii zakúpiť permanentku (3, 5 alebo 10 vstupov). Na iné služby prevádzkovateľa zakúpenie permanentky nie je možné.</p>
            <p className="mb-2">5.2 Permanentka nie je viazaná na konkrétny termín v čase jej zakúpenia; jednotlivé termíny si zákazník rezervuje v rezervačnom systéme.</p>
            <p className="mb-2">5.3 Permanentka je platná 6 mesiacov od dátumu zakúpenia a vstupy z nej je možné čerpať počas doby jej platnosti. Zakúpením permanentky zákazník uzatvára rámcovú zmluvu o poskytnutí služby.</p>
            <p className="mb-2">5.4 Od rámcovej zmluvy je zákazník oprávnený odstúpiť do 14 dní odo dňa jej uzatvorenia aj bez udania dôvodu, zaslaním odstúpenia od zmluvy (možné použiť formulár v <a href="#priloha-1" className="text-blue-700 hover:underline font-semibold">Prílohe č. 1</a> VOP).</p>
            <p className="mb-2">5.5 Zákazník nemôže odstúpiť od rámcovej zmluvy, ak sa poskytovanie služby začalo pred uplynutím lehoty na odstúpenie s jeho výslovným súhlasom a po poučení o strate práva na odstúpenie po úplnom poskytnutí služby.</p>
            <p className="mb-2">5.6 Ak zákazník odstúpi od zmluvy po udelení súhlasu podľa bodu 5.5, je povinný uhradiť cenu za skutočne poskytnuté plnenie.</p>
            <p className="mb-2">5.7 Permanentka je neprenosná a viazaná výlučne na užívateľský účet, z ktorého bola zakúpená.</p>
            <p className="mb-2">5.8 Pri rezervácii tréningu sa z účtu automaticky odpočíta príslušný počet vstupov.</p>
            <p className="mb-2">5.9 Po uplynutí platnosti permanentky nevyužité vstupy prepadajú bez nároku na náhradu, ak nebude dohodnuté inak.</p>
            <p>5.10 V prípade zrušenia užívateľského účtu zo strany zákazníka nedochádza automaticky k zániku práv a povinností z uzavretých zmlúv. Zrušenie účtu nie je odstúpením od zmluvy. Prevádzkovateľ umožní zákazníkovi počas doby platnosti nevyčerpaných plnení vytváranie rezervácií prostredníctvom kontaktných údajov.</p>
          </section>

          {/* Článok 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 6 Storno podmienky, refundácie a kredity</h2>
            <p className="mb-2">6.1 Zákazník môže zrušiť potvrdenú rezerváciu výhradne prostredníctvom užívateľského účtu (v prípade nedostupnosti alebo zrušeného účtu aj e-mailom/telefonicky).</p>
            <p className="mb-2">6.2 V prípade zrušenia rezervácie <strong>viac ako 10 hodín pred začiatkom tréningu</strong> má zákazník možnosť voľby: presunutie rezervácie, refundácia platby, pripísanie kreditu alebo vrátenie vstupu na permanentku.</p>
            <p className="mb-2">6.3 <strong>Menej ako 10 hodín pred začiatkom tréningu</strong> storno rezervácie nie je možné.</p>
            <p className="mb-2">6.4 V prípade zrušenia tréningu zo strany prevádzkovateľa má zákazník nárok na plnú refundáciu, kredit alebo vrátenie vstupu.</p>
            <p>6.5 Technické zlyhania nemajú vplyv na platnosť rezervácie, ak bola platba úspešne spracovaná.</p>
          </section>

          {/* Článok 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 7 Pravidlá účasti a bezpečnosť (Messy Play)</h2>
            <p className="mb-2">7.1 Aktivity sú senzorické a môžu viesť k znečisteniu odevu alebo pokožky.</p>
            <p className="mb-2">7.2 Za bezpečnosť, zdravie a správanie dieťaťa zodpovedá výlučne zákonný zástupca alebo sprevádzajúca dospelá osoba, ktorý nemôže ponechať dieťa bez jeho dozoru počas celého trvania aktivity.</p>
            <p className="mb-2">7.3 Prevádzkovateľ nezodpovedá za úrazy vzniknuté nedodržaním pokynov alebo v dôsledku povahy aktivít, pokiaľ neboli spôsobené porušením povinností prevádzkovateľa.</p>
            <p className="mb-2">7.4 Prevádzkovateľ nezodpovedá za poškodenie alebo znehodnotenie odevu, obuvi ani osobných vecí účastníkov.</p>
            <div className="mb-2">
              7.5 Účastníci sú povinní:
              <ul className="list-disc pl-6 mt-1">
                <li>dodržiavať pokyny inštruktora,</li>
                <li>neničiť vybavenie (“objavujeme, nie ničíme”),</li>
                <li>minimalizovať hluk a správať sa ohľaduplne,</li>
                <li>spolupracovať pri upratovaní priestoru po skončení aktivity.</li>
              </ul>
            </div>
            <p>7.6 Zákazník vyhlasuje, že zdravotný stav dieťaťa umožňuje jeho účasť na kolektívnej aktivite.</p>
          </section>

          {/* Článok 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 8 Alergie, intolerancie a zdravotné obmedzenia</h2>
            <p className="mb-2">8.1 Aktivity môžu zahŕňať použitie potravín, farieb, prírodných materiálov a látok, ktoré môžu predstavovať riziko pre osoby s alergiami.</p>
            <p className="mb-2">8.2 Zákazník je povinný pred rezerváciou zvážiť zdravotný stav dieťaťa.</p>
            <p className="mb-2">8.3 Prevádzkovateľ nezodpovedá za zdravotné komplikácie vzniknuté v dôsledku alergickej reakcie alebo intolerancie.</p>
            <p className="mb-2">8.4 Ak má dieťa známe alergie, zodpovednosť za jeho účasť nesie výlučne zákonný zástupca.</p>
            <p>8.5 Prevádzkovateľ môže na základe informácie od zákazníka primerane upraviť aktivitu, avšak negarantuje úplné vylúčenie alergénov.</p>
          </section>

          {/* Článok 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 9 Fotografie, videozáznamy a súhlasy</h2>
            <p className="mb-2">9.1 Počas tréningov môžu byť vyhotovované fotografie alebo videozáznamy.</p>
            <p className="mb-2">9.2 Záznamy môžu byť použité na marketingové účely výlučne na základe výslovného a dobrovoľného súhlasu zákonného zástupcu.</p>
            <p className="mb-2">9.3 Súhlas sa udeľuje v rezervačnom formulári.</p>
            <p className="mb-2">9.4 Zákazník má právo súhlas kedykoľvek odvolať.</p>
            <p>9.5 Ak zákazník súhlas neudelí alebo ho odvolá, prevádzkovateľ zabezpečí, aby dieťa nebolo na záznamoch identifikovateľné.</p>
          </section>

          {/* Článok 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 10 Technické a prevádzkové podmienky</h2>
            <p className="mb-2">10.1 Prevádzkovateľ si vyhradzuje právo vykonávať údržbu systému, počas ktorej môže byť web nedostupný.</p>
            <p className="mb-2">10.2 Dočasná nedostupnosť webu nezakladá nárok na náhradu škody.</p>
            <p>10.3 Prevádzkovateľ používa primerané technické a organizačné opatrenia na ochranu systému.</p>
          </section>

          {/* Článok 11 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 11 Vyššia moc</h2>
            <p className="mb-2">11.1 Prevádzkovateľ nenesie zodpovednosť za neplnenie povinností spôsobené vyššou mocou.</p>
            <p className="mb-2">11.2 Za vyššiu moc sa považujú najmä: živelná pohroma, epidémia, rozhodnutia orgánov, vojnový stav, výpadok energií a iné.</p>
            <p>11.3 V prípade vyššej moci má prevádzkovateľ právo tréning zrušiť alebo presunúť. Zákazníkovi bude ponúknutý náhradný termín alebo refundácia.</p>
          </section>

          {/* Článok 12 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 12 Alternatívne riešenie sporov (ARS)</h2>
            <p className="mb-2">12.1 Zákazník je oprávnený vytknúť vadu služby bez zbytočného odkladu, najneskôr do 3 dní od poskytnutia služby. Reklamácie budú vybavené do 30 dní.</p>
            <p className="mb-2">12.2 Zákazník má právo podať žiadosť o nápravu, ak nie je spokojný s vybavením reklamácie.</p>
            <p className="mb-2">12.3 Ak prevádzkovateľ na žiadosť o nápravu odpovie zamietavo alebo neodpovie do 30 dní, zákazník sa môže obrátiť na subjekt alternatívneho riešenia sporov (Slovenská obchodná inšpekcia).</p>
            <p className="mb-2">12.4 Bližšie informácie na <a href="https://www.soi.sk/alternativne-riesenie-spotrebitelskych-sporov" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.soi.sk</a>.</p>
            <p className="mb-2">12.5 Návrh na ARS možno podať aj cez platformu: <a href="https://consumer-redress.ec.europa.eu/dispute-resolution-bodies_en?prefLang=sk&etrans=sk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Platforma RSO</a>.</p>
            <p>12.6 Alternatívne riešenie sporov je bezodplatné (okrem zákonom stanovených prípadov).</p>
          </section>

          {/* Článok 13 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Čl. 13 Záverečné ustanovenia</h2>
            <p className="mb-2">13.1 Právne vzťahy neupravené týmito VOP sa spravujú Občianskym zákonníkom a zákonom o ochrane spotrebiteľa.</p>
            <p className="mb-2">13.2 Prevádzkovateľ si vyhradzuje právo meniť VOP; zmeny nadobúdajú účinnosť ich zverejnením.</p>
            <p className="mb-4">13.3 Tieto VOP nadobúdajú platnosť a účinnosť dňom 1. 2. 2026.</p>
          </section>

          {/* Príloha č. 1 */}
          <section className="mt-8" id="priloha-1">
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
              <button
                type="button"
                className="w-full px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={toggleAttachmentOne}
              >
                <span className="text-xl font-bold text-gray-900 pr-4 flex-1 text-left">
                  Príloha č. 1 – Formulár na odstúpenie od zmluvy
                </span>
                <span className="text-gray-500 flex-shrink-0">
                  {isAttachmentOneOpen ? '▴' : '▾'}
                </span>
              </button>

              {isAttachmentOneOpen && (
                <div className="px-6 pb-6">
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-gray-700 leading-relaxed">
                      Formulár na odstúpenie od zmluvy si môžete stiahnuť tu:
                    </p>
                    <a
                      href="/Odstupenie_od_zmluvy_nitracik.pdf"
                      download
                      className="inline-flex items-center mt-3 text-blue-700 hover:underline font-semibold"
                    >
                      Stiahnuť formulár (PDF)
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Príloha č. 2 */}
          <section className="mt-8">
            <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
              <button
                type="button"
                className="w-full px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                onClick={toggleAttachment}
              >
                <span className="text-xl font-bold text-gray-900 pr-4 flex-1 text-left">
                  Príloha č. 2 – Stručné pravidlá pre rodičov (FAQ)
                </span>
                <span className="text-gray-500 flex-shrink-0">
                  {isAttachmentOpen ? '▴' : '▾'}
                </span>
              </button>

              {isAttachmentOpen && (
                <div className="px-6 pb-6">
                  <div className="border-t border-gray-200 pt-4">
                    <div className="space-y-4">
                      {faqItems.map((item, index) => (
                        <div key={`${item.question}-${index}`}>
                          <strong className="block text-gray-900">{item.question}</strong>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 text-gray-900">
                      Viac odpovede nájdete{' '}
                      <Link to="/faq" className="text-blue-700 hover:underline font-semibold">
                        TU
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Terms;