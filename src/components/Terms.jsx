import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronDown, ArrowRight, HelpCircle } from 'lucide-react';

const FlakPink = ({ className, style }) => (
  <svg viewBox="0 0 170.079 170.658" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,102.0004,33.3618)" fill="#F4A5A5" d="M0 0C-.049 .001-.084 .006-.122 .01-.182 .023-.241 .037-.301 .049-.28 .054-.187 .045 0 0M19.592-55.855C20.281-56.109 20.126-56.34 19.592-55.855M59.411-29.461C57.428-26.123 53.616-24.284 50.208-22.771 45.813-20.82 41.283-19.202 36.756-17.587 34.934-16.937 33.322-16.418 31.946-15.898 33.149-13.263 34.563-10.35 35.803-7.743 38.635-1.79 44.262 6.585 43.568 13.498L43.497 13.469C43.477 15.353 42.864 17.163 41.371 18.802 37.474 23.079 28.987 20.373 28.555 14.604 28.445 14.402 28.336 14.198 28.223 14.009 27.353 12.55 26.389 11.142 25.433 9.738 23.773 7.298 22.062 4.894 20.341 2.496 17.561 3.718 13.969 3.659 11.099 3.032 9.233 2.625 7.411 2.02 5.587 1.448 4.969 4.959 2.515 8.404-1.587 7.855-4.99 7.4-8.385 6.912-11.775 6.385-12.271 11.193-13.235 15.956-14.62 20.562-16.34 26.288-22.863 27.479-27.155 23.872-29.653 21.772-31.991 19.435-34.568 17.453-34.618 17.567-34.663 17.681-34.714 17.794-38.307 25.869-50.188 19.92-48.422 12.015-47.755 9.033-46.907 6.076-45.887 3.176-46.502 3.008-47.126 2.762-47.758 2.406-57.967-3.36-68.755-7.401-80.21-9.896-84.776-10.891-86.216-14.818-85.362-18.369-86.023-18.416-86.685-18.451-87.347-18.501-96.907-19.233-97.085-33.067-87.347-33.501-81.613-33.757-75.879-34.013-70.144-34.269-70.426-35.257-70.513-36.288-70.372-37.299-71.676-36.835-73.11-36.745-74.61-37.174-77.526-38.008-80.49-41.163-80.116-44.406-79.648-48.474-77.55-52.006-74.602-54.375-73.368-56.077-72.13-57.775-70.894-59.475-73.925-59.862-76.894-62.027-77.429-64.966-77.515-65.437-77.579-65.903-77.632-66.367-77.665-66.302-77.709-66.233-77.74-66.169-77.842-65.96-78.057-65.256-78.171-64.792-78.171-64.779-78.171-64.766-78.17-64.753-78.013-65.121-77.933-63.415-78.146-64.399-76.112-55.002-90.455-50.97-92.61-60.411-94.585-69.06-90.861-78.252-87.146-85.912-83.522-93.383-78.368-102.026-71.043-106.413-70.899-106.499-70.752-106.575-70.607-106.655-71.385-107.292-72.087-107.977-72.681-108.716-75.51-112.236-75.857-118.087-71.163-120.496-66.359-122.962-59.616-121.749-53.963-118.957-52.734-120.363-51.239-121.576-49.448-122.532-45.554-124.61-40.944-124.631-36.98-122.994-32.924-124.98-28.867-126.966-24.81-128.953-21.445-130.6-16.346-130.152-14.549-126.262-12.801-122.479-12.278-118.361-12.835-114.457-12.433-114.495-12.031-114.533-11.629-114.57-7.965-114.914-4.666-111.455-4.263-108.067-4.142-107.049-4.209-106.096-4.432-105.218-3.22-104.77-2.05-104.177-.94-103.467 1.423-105.279 3.805-107.066 6.221-108.806 12.385-113.244 19.072-118.602 26.383-121.019 31.118-122.584 36.677-121.152 38.264-115.886 39.425-112.034 37.477-108.294 35.327-105.21 31.237-99.345 26.243-94.192 21.555-88.821 21.454-88.705 21.354-88.587 21.253-88.471 25.425-87.677 28.671-85.208 31.348-81.712 33.784-78.532 31.874-73.606 28.881-71.604 29.147-71.392 29.404-71.181 29.645-70.975 34.107-67.15 37.25-61.703 36.609-55.69 35.893-48.969 30.618-45.112 25.644-41.229 34.669-43.988 45.652-46.496 54.535-42.159 59.491-39.739 62.499-34.66 59.411-29.461" />
  </svg>
);

const FlakCream = ({ className, style }) => (
  <svg viewBox="0 0 170.079 186.77" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path transform="matrix(1,0,0,-1,48.2144,165.57071)" fill="#EFE4C8" d="M0 0C-.168-.194-.238-.269 0 0M-26.05 53.518C-26.131 53.517-26.214 53.524-26.295 53.521-26.528 53.513-26.826 53.628-27.052 53.58-26.742 53.646-26.402 53.614-26.05 53.518M-21.47 47.527C-21.498 47.541-21.521 47.552-21.534 47.559-21.638 47.617-21.705 47.635-21.758 47.641-21.758 47.645-21.757 47.646-21.757 47.65-21.734 48.081-21.613 47.898-21.47 47.527M110.15 62.303C107.116 63.184 104.727 64.781 102.823 66.842 103.529 68.373 103.864 69.987 103.89 71.627 107.735 73.614 110.494 77.248 110.025 82.154 109.638 86.21 106.903 89.629 102.525 89.654 100.286 89.667 98.047 89.68 95.808 89.693 95.791 89.776 95.772 89.859 95.755 89.942 96.096 90.51 96.433 91.081 96.746 91.661 102.128 101.644 101.602 115.764 91.484 122.235 87.426 127.948 80.504 130.605 73.631 130.344 71.238 131.943 68.231 132.319 65.794 131.33 65.44 132.156 65.044 132.975 64.57 133.777 62.624 137.073 59.423 137.949 56.571 137.17 53.53 142.418 50.094 147.541 46.219 152.177 44.129 154.678 41.587 157.301 38.336 158.187 33.582 159.483 29.055 156.611 27.626 152.049 25.506 145.277 27.868 136.599 29.08 129.88 29.306 128.625 29.59 127.328 29.898 126.01 29.882 125.982 29.865 125.955 29.849 125.928 28.135 124.055 26.418 122.185 24.71 120.308 23.918 119.437 22.939 118.469 21.906 117.431 21.381 117.615 20.844 117.777 20.293 117.908 16.407 124.779 12.204 132.099 11.117 139.561 10.307 145.122 2.057 146.775-1.419 142.871-7.775 135.73-6.737 125.805-4.314 117.219-4.223 116.895-4.111 116.574-4.015 116.251-7.819 115.72-11.541 114.236-14.5 111.961-21.762 114.214-29.373 114.816-36.422 113.282-43.959 111.641-43.148 100.885-36.422 98.818-29.578 96.714-23.759 92.901-18.416 88.34-20.759 88.357-23.047 87.64-24.772 85.878-28.055 82.525-27.219 78.105-25.606 74.209-22.098 65.735-14.95 59.381-7.67 54.053-10.925 53.889-14.181 53.732-17.439 53.612-19.622 53.532-21.81 53.451-23.995 53.466-24.472 53.469-24.953 53.493-25.433 53.509-29.306 54.641-34.412 52.786-35.444 48.477-37.939 38.061-28.156 33.128-19.643 31.287-12.564 29.757-5.314 29.111 1.923 28.51 .46 22.217-.966 15.912-2.183 9.568-3.345 3.505-4.649-2.693-3.781-8.86-3.037-14.148 3.398-15.053 7.236-13.342 12.229-11.117 15.582-4.028 18.151 .638 18.69-.342 19.373-1.294 20.226-2.201 25.939-8.272 35.783-8.166 42.419-3.696 46.618-.867 48.926 3.22 50.119 7.756 57.704 3.858 66.779 2.626 74.906 4.709 80.686 6.19 88.654 10.306 92.058 15.338 97.075 22.757 91.471 28.464 84.373 30.439 84.335 30.449 84.258 30.473 84.159 30.504 85.116 32.223 85.851 34.067 86.308 35.971 87.099 39.259 87.17 43.268 86.072 46.52 86.044 46.603 86.006 46.683 85.976 46.765 86.932 46.624 87.894 46.427 88.868 46.138 91.649 45.314 94.118 46.242 95.839 47.967 97.975 47.722 99.924 48.397 101.384 49.651 102.872 48.948 104.456 48.334 106.162 47.839 115.451 45.143 119.417 59.614 110.15 62.303" />
  </svg>
);

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative w-full bg-white">
      <section className="py-12 md:py-16 container-custom max-w-4xl mx-auto px-4 sm:px-6 relative">
      <div className="bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md p-8 sm:p-12 md:p-16 relative overflow-hidden" style={{ isolation: 'isolate' }}>
        <FlakCream className="absolute pointer-events-none" style={{ width: 200, top: 10, right: -25, opacity: 0.32, zIndex: -1, transform: 'rotate(20deg)' }} />
        <FlakPink className="absolute pointer-events-none" style={{ width: 185, bottom: 10, left: -20, opacity: 0.35, zIndex: -1, transform: 'rotate(-35deg)' }} />
        
        {/* Hlavný nadpis - identický s GDPR */}
        <div className="text-center pb-4 mb-6 border-b border-neutral-100">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">
            Všeobecné obchodné podmienky (VOP)
          </h1>
        </div>

        <div className="space-y-8 text-neutral-600 leading-relaxed font-medium text-justify">
          
          {/* Článok 1 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 1 Úvodné ustanovenia</h2>
            <p className="mb-3">
              1.1 Tieto Všeobecné obchodné podmienky (ďalej len „VOP“) upravujú práva a povinnosti medzi <strong className="text-foreground">Nitráčik o.z.</strong> ako poskytovateľom služieb ďalej uvedených v týchto VOP (ďalej len „prevádzkovateľ“) a fyzickou osobou – spotrebiteľom (ďalej len „zákazník“ alebo „účastník“), ktorá prostredníctvom webovej stránky nitracik.sk (ďalej len „web“) využíva rezervačný systém na objednanie tréningov, workshopov alebo senzorických hier („Messy & sensory play“ alebo „služby“).
            </p>
            <div className="mb-3">
              1.2 Prevádzkovateľ:
              <ul className="space-y-1.5 list-disc pl-5 mt-2 marker:text-primary">
                <li><strong className="text-foreground">Obchodné meno:</strong> Nitráčik o.z.</li>
                <li><strong className="text-foreground">Sídlo:</strong> Hydinárska 13A Nitra 94901</li>
                <li><strong className="text-foreground">IČO:</strong> 56374453</li>
                <li><strong className="text-foreground">DIČ:</strong> 2122328791 – registrované Okresným úradom Nitra pod č. VVS/1-900/90-70205</li>
                <li><strong className="text-foreground">Kontaktný e-mail:</strong> <a href="mailto:info@nitracik.sk" className="text-primary font-bold hover:underline">info@nitracik.sk</a></li>
                <li><strong className="text-foreground">Telefónne číslo:</strong> +421 949 584 576</li>
                <li><strong className="text-foreground">Orgán dozoru:</strong> Slovenská obchodná inšpekcia, Inšpektorát SOI pre Nitriansky kraj, odbor výkonu dohľadu, Staničná 9, P.O.BOX 49A, 950 50 Nitra.</li>
              </ul>
              <span className="block mt-2">Miestom poskytovania služieb je sídlo prevádzkovateľa.</span>
            </div>
            <p className="mb-3">
              1.3 Tieto VOP sú neoddeliteľnou súčasťou zmluvy o poskytnutí služby uzatvorenej na diaľku podľa § 52 a nasl. Občianskeho zákonníka a zákona č. 108/2024 Z.z. o ochrane spotrebiteľa.
            </p>
            <p>
              1.4 Zákazník s týmito VOP vyjadruje výslovný súhlas pri objednávke služieb alebo zakúpení permanentky.
            </p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 2 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 2 Užívateľský účet a registrácia</h2>
            <p className="mb-2">2.1 Rezervácia služieb je možná výhradne prostredníctvom registrovaného užívateľského účtu, ktorý je dostupný na webe. Užívateľský účet slúži na evidenciu rezervácií, komunikáciu so zákazníkom a zabezpečenie riadneho a bezpečného poskytovania služieb pre deti.</p>
            <p className="mb-2">2.2 Registrácia a vedenie účtu je bezplatné. Zákazník je povinný uvádzať pravdivé, aktuálne a úplné údaje.</p>
            <p className="mb-2">2.3 Užívateľský účet je zabezpečený prihlasovacími údajmi (e-mail a heslo). Zákazník je povinný tieto údaje chrániť a nezdieľať ich s tretími osobami.</p>
            <p className="mb-2">2.4 Prevádzkovateľ nenesie zodpovednosť za zneužitie účtu v prípade porušenia povinností zákazníka.</p>
            <p className="mb-2">2.5 Zákazník má právo kedykoľvek požiadať o zrušenie svojho užívateľského účtu prostredníctvom funkcionality dostupnej v užívateľskom profile alebo písomne na kontaktný e-mail prevádzkovateľa.</p>
            <p className="mb-2">2.6 Zrušením užívateľského účtu dochádza k trvalému vymazaniu osobných údajov zákazníka zo systému prevádzkovateľa (najmä meno, priezvisko, e-mail, telefónne číslo, adresa, ak boli poskytnuté), s výnimkou údajov, ktoré je prevádzkovateľ povinný uchovávať podľa osobitných právnych predpisov.</p>
            <p>2.7 O úspešnom zrušení užívateľského účtu a vymazaní osobných údajov bude zákazník informovaný prostredníctvom e-mailu.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 3 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 3 Objednávka služieb a uzatvorenie zmluvy</h2>
            <p className="mb-2">3.1 Spôsobom objednávania služieb je rezervácia služby prostredníctvom registrovaného užívateľského účtu dostupného na webe v rezervačnom systéme. Zákazník si vyberá službu z ponuky služieb zverejnenej v rezervačnom systéme dostupnom po prihlásení sa do svojho užívateľského účtu.</p>
            <p className="mb-2">3.2 Rezerváciou konkrétneho termínu služby, úspešným spracovaním platby prostredníctvom platobnej brány Stripe, resp. odpísaním vstupu zo zakúpenej permanentky, vzniká zmluva o poskytnutí služby súvisiacej s činnosťami v rámci voľného času, ktorá je viazaná na konkrétny termín. Po vykonaní úspešnej rezervácie bude zákazníkovi doručený potvrdzujúci e-mail.</p>
            <p className="mb-2">3.3 Rezervácia je viazaná na konkrétny termín, typ tréningu a počet detí, pričom prevádzkovateľ si vyhradzuje právo službu zrušiť v prípade, že nebude prihlásený minimálny počet zákazníkov na daný termín. V prípade neuskutočnenia služby z dôvodu nenaplnenia kapacity bude zákazníkovi vrátená platba alebo poskytnutý náhradný termín.</p>
            <p className="mb-2">3.4 Prevádzkovateľ si vyhradzuje právo odmietnuť účasť osobám, ktoré nie sú uvedené v rezervácii alebo by prekročili kapacitné limity priestoru.</p>
            <p>3.5 V súlade s § 19 ods. 1 písm. l) zákona č. 108/2024 Z.z. o ochrane spotrebiteľa nemá zákazník právo na odstúpenie od zmluvy o poskytnutí služby súvisiacej s činnosťami v rámci voľného času uzatvorenej podľa bodu 3.2 tohto článku VOP, nakoľko ide o poskytnutie služby v presne dohodnutom čase.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 4 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 4 Platobné podmienky</h2>
            <p className="mb-2">4.1 Ceny za jednotlivé aktivity sú konečné a uvedené priamo v rezervačnom systéme.</p>
            <p className="mb-2">4.2 Platba je možná výhradne online platobnou kartou prostredníctvom Stripe.</p>
            <p className="mb-2">4.3 Platba na mieste nie je možná.</p>
            <p>4.4 Prevádzkovateľ neuchováva platobné údaje zákazníkov; spracovanie platieb zabezpečuje Stripe ako samostatný prevádzkovateľ platobnej služby.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 5 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 5 Permanentky</h2>
            <p className="mb-2">5.1 Na aktivitu „Ufúľané senzorické hry“ si Zákazník môže na webe po registrácii zakúpiť permanentku (3, 5 alebo 10 vstupov). Na iné služby prevádzkovateľa zakúpenie permanentky nie je možné.</p>
            <p className="mb-2">5.2 Permanentka nie je viazaná na konkrétny termín v čase jej zakúpenia; jednotlivé termíny si zákazník rezervuje v rezervačnom systéme.</p>
            <p className="mb-2">5.3 Permanentka je platná 6 mesiacov od dátumu zakúpenia a vstupy z nej je možné čerpať počas doby jej platnosti. Zakúpením permanentky zákazník uzatvára rámcovú zmluvu o poskytnutí služby.</p>
            <p className="mb-2">5.4 Od rámcovej zmluvy je zákazník oprávnený odstúpiť do 14 dní odo dňa jej uzatvorenia aj bez udania dôvodu, zaslaním odstúpenia od zmluvy (možné použiť formulár v <a href="#priloha-1" className="text-primary font-bold hover:underline">Prílohe č. 1</a> VOP).</p>
            <p className="mb-2">5.5 Zákazník nemôže odstúpiť od rámcovej zmluvy, ak sa poskytovanie služby začalo pred uplynutím lehoty na odstúpenie s jeho výslovným súhlasom a po poučení o strate práva na odstúpenie po úplnom poskytnutí služby.</p>
            <p className="mb-2">5.6 Ak zákazník odstúpi od zmluvy po udelení súhlasu podľa bodu 5.5, je povinný uhradiť cenu za skutočne poskytnuté plnenie.</p>
            <p className="mb-2">5.7 Permanentka je neprenosná a viazaná výlučne na užívateľský účet, z ktorého bola zakúpená.</p>
            <p className="mb-2">5.8 Pri rezervácii tréningu sa z účtu automaticky odpočíta príslušný počet vstupov.</p>
            <p className="mb-2">5.9 Po uplynutí platnosti permanentky nevyužité vstupy prepadajú bez nároku na náhradu, ak nebude dohodnuté inak.</p>
            <p>5.10 V prípade zrušenia užívateľského účtu zo strany zákazníka nedochádza automaticky k zániku práv a povinností z uzavretých zmlúv. Zrušenie účtu nie je odstúpením od zmluvy. Prevádzkovateľ umožní zákazníkovi počas doby platnosti nevyčerpaných plnení vytváranie rezervácií prostredníctvom kontaktných údajov.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 6 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 6 Darčekový poukaz</h2>
            <p className="mb-2">6.1 Prevádzkovateľ ponúka zákazníkom možnosť zakúpiť si darčekový poukaz v nominálnej hodnote 15 €, 30 €, 50 € alebo 100 € prostredníctvom webu.</p>
            <p className="mb-2">6.2 Darčekový poukaz je po úspešnom prijatí platby vystavený v elektronickej forme. Poukaz obsahuje jedinečný kód, nominálnu hodnotu a dátum platnosti.</p>
            <p className="mb-2">6.3 Darčekový poukaz je platný 12 mesiacov odo dňa jeho vystavenia. Po uplynutí doby platnosti ho nie je možné použiť ani vymeniť za peňažnú náhradu.</p>
            <p className="mb-2">6.4 Darčekový poukaz je možné uplatniť na úhradu ľubovoľnej aktivity z ponuky prevádzkovateľa pre deti aj dospelých, a to zadaním jeho jedinečného kódu pri rezervácii.</p>
            <p className="mb-2">6.5 Darčekový poukaz je možné čerpať postupne. Pri každom použití sa z jeho zostatku odpočíta cena príslušnej rezervovanej služby, najviac však do výšky aktuálneho zostatku poukazu.</p>
            <p className="mb-2">6.6 Ak hodnota rezervovanej služby presahuje zostatok darčekového poukazu, zákazník môže rozdiel doplatiť platobnou kartou prostredníctvom Stripe.</p>
            <p className="mb-2">6.7 Ak je hodnota rezervovanej služby nižšia ako zostatok darčekového poukazu, nevyčerpaná časť zostáva k dispozícii na ďalšie použitie počas doby platnosti poukazu. Nevyčerpaný zostatok nie je možné vyplatiť v hotovosti ani inak refundovať.</p>
            <p className="mb-2">6.8 Darčekový poukaz je prenosný a môže ho použiť osoba, ktorej bol darovaný, alebo iná osoba, ktorá disponuje jeho platným kódom. Zákazník je povinný chrániť kód poukazu pred zneužitím.</p>
            <p className="mb-2">6.9 Po úplnom vyčerpaní hodnoty darčekového poukazu sa jeho stav zmení na použitý a poukaz už nie je možné ďalej uplatniť.</p>
            <p>6.10 V prípade straty alebo neoprávneného sprístupnenia kódu darčekového poukazu je zákazník povinný bezodkladne kontaktovať prevádzkovateľa. Prevádzkovateľ nezodpovedá za použitie poukazu osobou, ktorá sa dostala k jeho kódu.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 7 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 7 Storno podmienky, refundácie a kredity</h2>
            <p className="mb-2">7.1 Zákazník môže zrušiť potvrdenú rezerváciu výhradne prostredníctvom užívateľského účtu (v prípade nedostupnosti alebo zrušeného účtu aj e-mailom/telefonicky).</p>
            <p className="mb-2">7.2 V prípade zrušenia rezervácie <strong className="text-foreground">viac ako 10 hodín pred začiatkom tréningu</strong> má zákazník možnosť voľby: presunutie rezervácie, refundácia platby, pripísanie kreditu alebo vrátenie vstupu na permanentku.</p>
            <p className="mb-2">7.3 <strong className="text-foreground">Menej ako 10 hodín pred začiatkom tréningu</strong> storno rezervácie nie je možné.</p>
            <p className="mb-2">7.4 V prípade zrušenia tréningu zo strany prevádzkovateľa má zákazník nárok na plnú refundáciu, kredit alebo vrátenie vstupu.</p>
            <p>7.5 Technické zlyhania nemajú vplyv na platnosť rezervácie, ak bola platba úspešne spracovaná.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 8 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 8 Pravidlá účasti a bezpečnosť (Messy Play)</h2>
            <p className="mb-2">8.1 Aktivity sú senzorické a môžu viesť k znečisteniu odevu alebo pokožky.</p>
            <p className="mb-2">8.2 Za bezpečnosť, zdravie a správanie dieťaťa zodpovedá výlučne zákonný zástupca alebo sprevádzajúca dospelá osoba, ktorý nemôže ponechať dieťa bez jeho dozoru počas celého trvania aktivity.</p>
            <p className="mb-2">8.3 Prevádzkovateľ nezodpovedá za úrazy vzniknuté nedodržaním pokynov alebo v dôsledku povahy aktivít, pokiaľ neboli spôsobené porušením povinností prevádzkovateľa.</p>
            <p className="mb-2">8.4 Prevádzkovateľ nezodpovedá za poškodenie alebo znehodnotenie odevu, obuvi ani osobných vecí účastníkov.</p>
            <div className="mb-2">
              8.5 Účastníci sú povinní:
              <ul className="space-y-1 list-disc pl-5 mt-1 marker:text-primary">
                <li>dodržiavať pokyny inštruktora,</li>
                <li>neničiť vybavenie (“objavujeme, nie ničíme”),</li>
                <li>minimalizovať hluk a správať sa ohľaduplne,</li>
                <li>spolupracovať pri upratovaní priestoru po skončení aktivity.</li>
              </ul>
            </div>
            <p>8.6 Zákazník vyhlasuje, že zdravotný stav dieťaťa umožňuje jeho účasť na kolektívnej aktivite.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 9 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 9 Alergie, intolerancie a zdravotné obmedzenia</h2>
            <p className="mb-2">9.1 Aktivity môžu zahŕňať použitie potravín, farieb, prírodných materiálov a látok, ktoré môžu predstavovať riziko pre osoby s alergiami.</p>
            <p className="mb-2">9.2 Zákazník je povinný pred rezerváciou zvážiť zdravotný stav dieťaťa.</p>
            <p className="mb-2">9.3 Prevádzkovateľ nezodpovedá za zdravotné komplikácie vzniknuté v dôsledku alergickej reakcie alebo intolerancie.</p>
            <p className="mb-2">9.4 Ak má dieťa známe alergie, zodpovednosť za jeho účasť nesie výlučne zákonný zástupca.</p>
            <p>9.5 Prevádzkovateľ môže na základe informácie od zákazníka primerane upraviť aktivitu, avšak negarantuje úplné vylúčenie alergénov.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 10 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 10 Fotografie, videozáznamy a súhlasy</h2>
            <p className="mb-2">10.1 Počas tréningov môžu byť vyhotovované fotografie alebo videozáznamy.</p>
            <p className="mb-2">10.2 Záznamy môžu byť použité na marketingové účely výlučne na základe výslovného a dobrovoľného súhlasu zákonného zástupcu.</p>
            <p className="mb-2">10.3 Súhlas sa udeľuje v rezervačnom formulári.</p>
            <p className="mb-2">10.4 Zákazník má právo súhlas kedykoľvek odvolať.</p>
            <p>10.5 Ak zákazník súhlas neudelí alebo ho odvolá, prevádzkovateľ zabezpečí, aby dieťa nebolo na záznamoch identifikovateľné.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 11 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 11 Technické a prevádzkové podmienky</h2>
            <p className="mb-2">11.1 Prevádzkovateľ si vyhradzuje právo vykonávať údržbu systému, počas ktorej môže byť web nedostupný.</p>
            <p className="mb-2">11.2 Dočasná nedostupnosť webu nezakladá nárok na náhradu škody.</p>
            <p>11.3 Prevádzkovateľ používa primerané technické a organizačné opatrenia na ochranu systému.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 12 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 12 Vyššia moc</h2>
            <p className="mb-2">12.1 Prevádzkovateľ nenesie zodpovednosť za neplnenie povinností spôsobené vyššou mocou.</p>
            <p className="mb-2">12.2 Za vyššiu moc sa považujú najmä: živelná pohroma, epidémia, rozhodnutia orgánov, vojnový stav, výpadok energií a iné.</p>
            <p>12.3 V prípade vyššej moci má prevádzkovateľ právo tréning zrušiť alebo presunúť. Zákazníkovi bude ponúknutý náhradný termín alebo refundácia.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 13 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 13 Alternatívne riešenie sporov (ARS)</h2>
            <p className="mb-2">13.1 Zákazník je oprávnený vytknúť vadu služby bez zbytočného odkladu, najneskôr do 3 dní od poskytnutia služby. Reklamácie budú vybavené do 30 dní.</p>
            <p className="mb-2">13.2 Zákazník má právo podať žiadosť o nápravu, ak nie je spokojný s vybavením reklamácie.</p>
            <p className="mb-2">13.3 Ak prevádzkovateľ na žiadosť o nápravu odpovie zamietavo alebo neodpovie do 30 dní, zákazník sa môže obrátiť na subjekt alternatívneho riešenia sporov (Slovenská obchodná inšpekcia).</p>
            <div className="flex flex-col items-start gap-2.5 my-3">
              <a href="https://www.soi.sk/alternativne-riesenie-spotrebitelskych-sporov" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
                <span>Bližšie informácie na www.soi.sk</span>
              </a>
              <a href="https://consumer-redress.ec.europa.eu/dispute-resolution-bodies_en?prefLang=sk&etrans=sk" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
                <span>Návrh na ARS cez Platformu RSO</span>
              </a>
            </div>
            <p>13.6 Alternatívne riešenie sporov je bezodplatné (okrem zákonom stanovených prípadov).</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Článok 14 */}
          <section>
            <h2 className="text-xl font-extrabold text-foreground mb-4">Čl. 14 Záverečné ustanovenia</h2>
            <p className="mb-2">14.1 Právne vzťahy neupravené týmito VOP sa spravujú Občianskym zákonníkom a zákonom o ochrane spotrebiteľa.</p>
            <p className="mb-2">14.2 Prevádzkovateľ si vyhradzuje právo meniť VOP; zmeny nadobúdajú účinnosť ich zverejnením.</p>
            <p>14.3 Tieto VOP nadobúdajú platnosť a účinnosť dňom 1. 2. 2026.</p>
          </section>

          <hr className="border-neutral-100" />

          {/* Príloha č. 1 */}
          <section id="priloha-1" className="pt-2">
            <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                className="w-full px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={toggleAttachmentOne}
              >
                <span className="text-lg font-extrabold text-foreground pr-4 flex-1 text-left flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  Príloha č. 1 – Formulár na odstúpenie od zmluvy
                </span>
                <div
                  className="text-neutral-400 transition-transform duration-200"
                  style={{ transform: isAttachmentOneOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              {isAttachmentOneOpen && (
                <div className="overflow-hidden">
                  <div className="px-6 pb-6 pt-2 border-t border-neutral-100">
                    <p className="mb-3">Formulár na odstúpenie od zmluvy si môžete stiahnuť tu:</p>
                    <a
                      href="/Odstupenie_od_zmluvy_nitracik.pdf"
                      download
                      className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span>Stiahnuť formulár (PDF)</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Príloha č. 2 */}
          <section className="pt-2">
            <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
              <button
                type="button"
                className="w-full px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={toggleAttachment}
              >
                <span className="text-lg font-extrabold text-foreground pr-4 flex-1 text-left flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  Príloha č. 2 – Stručné pravidlá pre rodičov (FAQ)
                </span>
                <div
                  className="text-neutral-400 transition-transform duration-200"
                  style={{ transform: isAttachmentOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>

              {isAttachmentOpen && (
                <div className="overflow-hidden">
                  <div className="px-6 pb-6 pt-4 border-t border-neutral-100 space-y-4">
                    {faqItems.map((item, index) => (
                      <div key={`${item.question}-${index}`}>
                        <strong className="block text-foreground mb-1">{item.question}</strong>
                        <p className="text-neutral-600 leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-neutral-100">
                      Viac odpovedí nájdete{' '}
                      <Link to="/faq" className="text-primary font-bold hover:underline">
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
    </section>
    </div>
  );
};

export default Terms;