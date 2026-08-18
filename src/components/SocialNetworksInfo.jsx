import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronUp, Share2 } from 'lucide-react';

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
    <div className="relative w-full bg-white">
      <section className="py-12 md:py-16 container-custom max-w-4xl mx-auto px-4 sm:px-6 relative">
      <div className="bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md p-8 sm:p-12 md:p-16 relative overflow-hidden" style={{ isolation: 'isolate' }}>
        <FlakPink className="absolute pointer-events-none" style={{ width: 195, top: 10, left: -22, opacity: 0.33, zIndex: -1, transform: 'rotate(-10deg)' }} />
        <FlakCream className="absolute pointer-events-none" style={{ width: 175, top: '45%', right: -18, opacity: 0.30, zIndex: -1, transform: 'rotate(40deg)' }} />
        
        <Link 
          to="/gdpr" 
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-primary font-bold mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Späť na GDPR</span>
        </Link>
        
        <div className="text-center pb-4 mb-6 border-b border-neutral-100">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-3">
            <Share2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">
            Podmienky a informácie o spracúvaní osobných údajov – SPRÁVA PROFILOV NA SOCIÁLNYCH SIEŤACH
          </h1>
        </div>

        <div className="space-y-8 text-neutral-600 leading-relaxed font-medium text-justify">

          <section className="space-y-4">
            <p>
              Občianske združenie Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901, IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205 (ďalej len "občianske združenie" alebo "prevádzkovateľ" alebo „Nitráčik o.z.").
            </p>
            <p>
              Podľa druhu zmluvného vzťahu s prevádzkovateľom sú v tabuľke nižšie uvedené účely spracovania osobných údajov (ďalej len „OÚ") z ktorých je zrejmá kategória dotknutých osôb, právny základ na ich spracovanie ako aj doba, po ktorú bude prevádzkovateľ tieto OÚ spracovávať.
            </p>
            <p>
              Podmienky a informácie o spracúvaní osobných údajov Nitráčik o.z. vysvetľujú len základné otázky týkajúce sa správy profilov Nitráčik o.z. má pri spracúvaní Vašich OÚ cez jej profily na sociálnych sieťach iba typické administrátorské oprávnenia. Pri používaní sociálnych sietí sú Vaše OÚ spracúvané aj zo strany poskytovateľov týchto sociálnych sietí (napr. Facebook, Instagram). Nad týmto spracúvaním, ďalším poskytovaním Vašich OÚ tretím stranám a nad ich cezhraničným prenosom do tretích krajín (ktoré vykonávajú daní poskytovatelia sociálnych sietí) nemáme spravidla žiadnu kontrolu a nezodpovedáme za ne. Odporúčame Vám oboznámiť sa s podmienkami ochrany súkromia poskytovateľov platforiem sociálnych médií, cez ktoré spolu komunikujeme. Za spracúvanie Vašich OÚ prostredníctvom sociálnych sietí zodpovedá Nitráčik o.z. iba v prípade, ak je do tohto spracúvania priamo zapojená ako spoločný prevádzkovateľ alebo ako prevádzkovateľ využívajúci služby sprostredkovateľa. Nitráčik o.z. zodpovedá iba za svoje vlastné marketingové aktivity a za vlastné kampane na svojich oficiálnych profiloch na sociálnych sieťach, ktoré vysvetľujú tieto podmienky ochrany súkromia.
            </p>
          </section>

          <hr className="border-neutral-100" />

          <section className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground mb-4">FACEBOOK, INSTAGRAM A YOUTUBE:</h2>
            <p>
              OÚ pre sociálne siete Facebook, Instagram spracúva spoločnosť Meta Ltd., 4 Námestie Grand Canal, prístav Grand Canal, Dublin 2, Írsko (ďalej len „Facebook") tak, ako je to opísané v politike Facebooku na{' '}
              <a href="https://www.facebook.com/policy" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.facebook.com/policy
              </a>. Nitráčik o.z. by chcela zdôrazniť, že v tomto prípade môžu byť údaje užívateľov spracúvané aj mimo Európsku úniu. To môže mať za následok riziká pre užívateľa, pretože napr. vymáhanie práv užívateľov môže byť náročnejšie. Facebook sa však podriadil podmienkam ochrany súkromia EÚ - USA a súhlasí s tým, že bude dodržiavať normy EÚ na ochranu údajov (
              <a href="https://www.privacyshield.gov/participant?id=a2zt0000000GnywAAC&status=Active" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.privacyshield.gov/participant?id=a2zt0000000GnywAAC&status=Active
              </a>). V prípade ostatných poskytovateľov sociálnych sietí postupuje Nitráčik o.z. obdobne, a vždy si pre svoje oficiálne profily volí takú sociálnu sieť, ktorej prevádzkovateľ garantuje dodržiavanie noriem EÚ a dodržiavanie základných štandardov EÚ pre ochranu súkromia.
            </p>
            <p>Prevádzkovateľ má založené tieto fanpage prevádzkované spoločnosťou Facebook:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-primary">
              <li>
                <a href="https://www.facebook.com/people/Nitr%C3%A1%C4%8Dik/61558994166250/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                  https://www.facebook.com/people/Nitr%C3%A1%C4%8Dik/61558994166250/
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/nitracik" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                  https://www.instagram.com/nitracik
                </a>
              </li>
            </ul>
            <p>
              Pokiaľ nie je v týchto podmienkach uvedené inak, pre účel „sociálne siete – správa profilov" v zásade platí, že Nitráčik o.z. je voči prevádzkovateľom sociálnych sietí postavení osobitného prevádzkovateľa a prevádzkovateľ sociálnych sietí v postavení osobitného prevádzkovateľa.
            </p>
            <p>
              Odlišne od vyššie uvedeného je Nitráčik o.z. voči prevádzkovateľovi sociálnej siete Facebook pre účel „sociálne siete – správa profilov" v postavení prevádzkovateľa a prevádzkovateľ sociálnych sietí v postavení sprostredkovateľa Nitráčik o.z. V rámci tohto účelu môže Nitráčik o.z. využívať služby poskytované spoločnosťou Facebook, ktoré sú označené ako „data file custom audiences" – t. j. správa publika pre realizovanie reklamných kampaní, pričom v takomto prípade môže dochádzať k spájaniu OÚ spracúvaných Nitráčik o.z. s OÚ spracúvanými v databázach Facebooku a tiež služby označené ako „measurement and analytics" – t. j. služby v rámci ktorých Facebook spracúva OÚ v mene Nitráčik o.z. s cieľom merať výkonnosť a dosah reklamných kampaní Nitráčik o.z. a poskytuje Nitráčik o.z. prehľady používateľov, ktorí videli a reagovali na reklamný obsah Nitráčik o.z. umiestnený na Facebookových profiloch Nitráčik o.z. K tomuto spracúvaniu OÚ užívateľov môže dôjsť v prípade, ak užívateľ v rámci používania používateľského profilu zriadeného na Facebooku bude vykonávať interakcie s reklamným obsahom Nitráčik o.z. alebo s webstránkami Nitráčik o.z. V oboch týchto prípadoch využíva Nitráčik o.z. spoločnosť Facebook ako sprostredkovateľa, pričom sa na spracúvanie OÚ užívateľov sa v takomto prípade uplatňujú nasledovné právne záruky:{' '}
              <a href="https://www.facebook.com/legal/terms/businesstools" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.facebook.com/legal/terms/businesstools
              </a>,{' '}
              <a href="https://www.facebook.com/legal/terms/dataprocessing" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.facebook.com/legal/terms/dataprocessing
              </a>.
            </p>
            <p>
              Pre účel „sociálne siete – štatistické údaje" je Nitráčik o.z. spoločným prevádzkovateľom so spoločnosťou Facebook. V rámci tohto účelu môže Nitráčik o.z. údaje o užívateľoch a o ich správaní na sociálnych sieťach získané prostredníctvom poskytovateľov sociálnych sietí Facebook a Instagram spracúvať na účely prieskumu trhu a reklamy. Napr. zo správania užívateľov sociálnych sietí sa pri ich používaní vytvárajú tzv. profily použitia, v ktorých sa ukladajú záujmy užívateľov, a to bez ohľadu na zariadenia používané užívateľmi. Profily použitia sa môžu následne využívať pri ponuke a zobrazovaní reklám danému užívateľovi, tzv. personalizovaná reklama. Na tieto účely sa ukladajú v počítačoch užívateľov aj tzv. cookies, v ktorých je uložené užívateľské správanie a záujmy daného užívateľa. V rámci účelu „sociálne siete – štatistické údaje" Facebook poskytuje Nitráčik o.z. ako majiteľovi a správcovi jeho oficiálnych profilov na sociálnych sieťach (tzv. fanpage) štatistiku a informácie v takom rozsahu že ich je možne považovať za OÚ, nakoľko tieto pomáhajú Nitráčik o.z. získavať prehľad o druhoch akcií, ktoré užívatelia na svojich stránkach vykonávajú (ďalej len „Informácie o stránke"). Za účelom zbierania a spracúvania štatistických údajov je Nitráčik o.z. so spoločnosťou Facebook spoločnými prevádzkovateľmi, pričom OÚ získané na tieto účely sú spracúvané na základe dohody spoločných prevádzkovateľov medzi Nitráčik o.z. a Facebookom. Dohoda je dostupná tu:{' '}
              <a href="https://www.facebook.com/legal/terms/page_controller_addendum" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.facebook.com/legal/terms/page_controller_addendum
              </a>{' '}
              a tu{' '}
              <a href="https://sk-sk.facebook.com/help/instagram/155833707900388" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://sk-sk.facebook.com/help/instagram/155833707900388
              </a>.
            </p>
            <p>
              Informácie o tom, ako máte postupovať v prípade uplatnenia práva dotknutej osoby a ďalšie informácie o podmienkach spracúvania osobných údajov, sú uvedené v informáciách Facebooku, Instagramu na:{' '}
              <a href="https://www.facebook.com/about/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.facebook.com/about/privacy/
              </a>, opt-out:{' '}
              <a href="https://www.facebook.com/settings?tab=ads" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.facebook.com/settings?tab=ads
              </a>,{' '}
              <a href="https://help.instagram.com/581066165581870?ref=dp" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://help.instagram.com/581066165581870?ref=dp
              </a>{' '}
              a{' '}
              <a href="https://privacycenter.instagram.com/policy/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://privacycenter.instagram.com/policy/
              </a>. V prípade ostatných poskytovateľov sociálnych sietí sú obdobné údaje uvedené vždy priamo na ich stránke v sekcii základných dokumentov, ktoré sú označené napr. ako „Ochrana súkromia" alebo „Cookies".
            </p>
            <p>
              V prípade ostatných poskytovateľov sociálnych sietí sú obdobné údaje uvedené vždy priamo na ich stránke v sekcii základných dokumentov, ktoré sú označené napr. ako „Ochrana súkromia" alebo „Cookies".
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
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">1. registrovaní prihlásení užívatelia, registrovaní neprihlásení užívatelia a neregistrovaní užívatelia</td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      <strong className="text-foreground">SOCIÁLNE SIETE – SPRÁVA PROFILOV NA SOCIÁLNYCH SIEŤACH VRÁTANE KOMUNIKÁCIE A DISKUSIE S UŽÍVATEĽMI (FIREMNÝ PROFIL TZV. FANPAGE NA FACEBOOKU, INSTAGRAME)</strong><br/><br/>
                      Účelom spracúvania osobných údajov je propagácia (priamy i nepriamy marketing) a ponuka služieb Nitráčik o.z. na sociálnych sieťach, komunikácia s užívateľmi, propagácia súťaží a sprievodných aktivít prostredníctvom sociálnych sietí, poskytovanie informácií širšej verejnosti
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      čl. 6 ods. 1 písm. f) Nariadenia – OPRÁVNENÝ ZÁUJEM<br/><br/>
                      Oprávneným záujmom je: vytvorenie oficiálneho profilu Nitráčik o.z. na príslušnej sociálnej sieti (tzv. fanpage). Oprávneným záujmom je propagácia (priamy i nepriamy marketing) a ponuka služieb Nitráčik o.z. na sociálnych sieťach, komunikácia s užívateľmi, organizovanie súťaží a sprievodných aktivít prostredníctvom sociálnych sietí, poskytovanie informácií širšej verejnosti.
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      Údaje sa uchovávajú (a) do času, keď už nie sú potrebné na poskytovanie služieb a produktov prevádzkovateľa danej sociálnej siete; alebo (b) pokým užívateľ neodstráni svoj účet; a to podľa toho, čo nastane skôr.<br/><br/>
                      Toto je vecou konkrétneho prípadu a závisí to napr. od charakteru údajov; od dôvodu, prečo sú zhromažďované a spracúvané; a od relevantných právnych alebo prevádzkových potrieb uchovávania. Napr. profilové informácie, fotky, ktoré užívateľ uverejnil (a neodstránil), a informácie o zabezpečení uchováva Facebook počas celej životnosti účtu. Pokiaľ niečo hľadáte na Facebooku, uchováva históriu hľadania dovtedy, kým užívateľ nevymaže hľadanie zo svojho záznamu o činnosti alebo neodstráni svoj účet. Potom, ako vymažete hľadanie alebo odstránite svoj účet, tieto informácie už nebudú pre užívateľa viditeľné a odstránia sa.<br/><br/>
                      Lehotu uchovávania v prípade Instagramu, Facebooku nájdete na: https://privacycenter.instagram.com/policy/.
                    </td>
                    <td className="px-4 py-3 align-top">
                      odborní konzultanti a poradcovia ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti; subjekty, ktorým prevádzkovateľ poskytuje OÚ na základe zákona; V prípade služieb „data file custom audiences" a „measurement and analytics" je prevádzkovateľ sociálnej siete Facebook voči Nitráčik o.z. v postavení jej sprostredkovateľa;
                    </td>
                  </tr>
                  <tr>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">2. registrovaní prihlásení užívatelia, registrovaní neprihlásení užívatelia a neregistrovaní užívatelia</td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      <strong className="text-foreground">AGENDA FACEBOOK a INSTAGRAM – ŠTATISTICKÉ ÚČELY</strong><br/><br/>
                      Účelom spracúvania osobných údajov je sledovanie štatistických informácií spojených s profilom prevádzkovateľa na danej sociálnej sieti. Štatistické informácie sú spojené so správou profilu na sociálnej sieti Facebook a Instagram a sú vlastníkovi profilu automaticke dostupné. Prevádzkovateľ údaje o užívateľoch a o ich správaní na sociálnych sieťach získané prostredníctvom poskytovateľa sociálnych sietí Facebook a Instagram spracúva na štatistické účely spojené so základným účelom existencie profilu prevádzkovateľa, t.j. zvyšovania povedomia o aktivitách prevádzkovateľa.<br/><br/>
                      Pre bližšie vysvetlenie odkazujeme na recitál 50 GDPR, podľa ktorého „spracúvanie OÚ na iné účely ako na účely, na ktoré boli OÚ pôvodne získané, by malo byť umožnené len vtedy, ak je toto spracúvanie zlučiteľné s účelmi, na ktoré boli OÚ pôvodne získané. V takom prípade sa nevyžaduje žiadny iný samostatný právny základ, než je právny základ, ktorý umožňoval získavanie OÚ. Ďalšie spracúvanie na štatistické účely by sa malo považovať za zlučiteľné so zákonnými spracovateľskými operáciami."
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      čl. 6 ods. 1 písm. f) Nariadenia – OPRÁVNENÝ ZÁUJEM<br/><br/>
                      Oprávneným záujmom spoločných prevádzkovateľov spoločnosti Facebook a Nitráčik o.z. je: získanie OÚ na základe právneho základu pôvodného účelu a ich následné spracúvanie na štatistické účely pre používanie sietí Facebook a Instagram v zmysle režimu podľa čl. 89 GDPR. Oprávneným záujmom je získanie, tzn. spracúvanie viacerých údajov, najmä demografických údajov cieľovej skupiny ako údaje týkajúce sa veku, pohlavia, rodinného stavu, povolania, životného štýlu a záujmov návštevníkov fanúšikovskej stránky, ako aj informácie ohľadom ich internetových nákupov a kategórií nakupovaných výrobkov a služieb, alebo geografických údajov. Nitráčik o.z. nastavila parametre okrem iného podľa svojej cieľovej skupiny, ako aj cieľov riadenia alebo podpory svojich činností, čo má vplyv na spracúvanie OÚ na účely vypracovania štatistík získaných na základe návštev fanúšikovskej stránky. Nitráčik o.z. môže v prípade Facebooku a Instagramu pomocou filtrov, ktoré jej poskytuje spoločnosť Facebook, vymedziť kritériá, na základe ktorých majú byť tieto štatistiky vypracované a tiež vymedziť kategórie osôb, ktorých OÚ budú využívané spoločnosťou Facebook. Nitráčik o.z. ako majiteľ a správca fanpage umiestnenej na Facebooku a Instagrame preto prispievajú k spracúvaniu OU návštevníkov svojej stránky. Všetky tieto informácie umožňujú Nitráčik o.z. napr. zistiť profil návštevníkov, ktorí kladne hodnotia jej fanpage, alebo ktorí využívajú jej aplikácie, s cieľom ponúknuť im relevantnejší obsah a rozvinúť funkcie, o ktoré by títo návštevníci mohli mať väčší záujem.
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      Údaje sa uchovávajú do času, keď už nie sú potrebné na poskytovanie služieb a produktov prevádzkovateľa danej sociálnej siete, alebo pokým užívateľ neodstráni svoj účet – podľa toho, čo nastane skôr.<br/><br/>
                      Toto je vecou konkrétneho prípadu a závisí to napr. od charakteru údajov; od dôvodu, prečo sú zhromažďované a spracúvané; a od relevantných právnych alebo prevádzkových potrieb uchovávania.<br/><br/>
                      https://privacycenter.instagram.com/policy
                    </td>
                    <td className="px-4 py-3 align-top">
                      subjekty, ktorým prevádzkovateľ poskytuje OÚ na základe zákona, spoločnosti zabezpečujúce správu profilov na sociálnych sieťach; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti;
                    </td>
                  </tr>
                  <tr>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">3. fyzické osoby uplatňujúce svoje práva ako dotknuté osoby</td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      <strong className="text-foreground">UPLATNENIE PRÁV DOTKNUTEJ OSOBY</strong><br/>
                      Účelom spracúvania OÚ je uplatňovanie práv dotknutých osôb podľa GDPR. (tento účel sa vzťahuje na prípady, keď dôjde k uplatneniu Vašich práv podľa GDPR)
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      spracúvanie je v zmysle čl. 6 ods. 1 písm. c) Nariadenia nevyhnutné na splnenie zákonnej povinnosti prevádzkovateľa vyplývajúcej z nariadenia a zo zákona č. 18/2018 Z. z.
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">5 rokov nasledujúcich po roku, v ktorom bola žiadosť vybavená</td>
                    <td className="px-4 py-3 align-top">
                      subjekty, ktorým prevádzkovateľ poskytuje osobné údaje na základe zákona; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti; spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby;
                    </td>
                  </tr>
                  <tr>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">4. Strany sporu, účastníci konania a ďalšie zúčastnené osoby</td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      <strong className="text-foreground">AGENDA VYBAVOVANIA SÚDNYCH SPOROV, EXEKÚCIÍ, VYMÁHANIE POHĽADÁVOK</strong><br/>
                      Účelom spracúvania OÚ je vybavovanie súdnych sporov, exekúcií a vymáhania pohľadávok.
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">
                      čl. 6 ods. 1 písm. c) Nariadenia - nevyhnutné na splnenie ZÁKONNÝCH POVINNOSTÍ prevádzkovateľa vyplývajúcich zo zák. č. 160/2015 Z. z., zák. č. 244/2002 Z. z., zák. č. 301/2005 Z. z., zák. č. 7/2005 Z. z., zák. č. 38/1993 Z. z., zák. č. 162/2015 Z. z., zák. č. 233/1995 Z. z. a súvisiacich právnych predpisov
                    </td>
                    <td className="border-r border-neutral-200 px-4 py-3 align-top">10 rokov po právoplatnom skočení príslušného konania</td>
                    <td className="px-4 py-3 align-top">
                      súdy, exekútori, advokáti a iné orgány verejnej správy a subjekty, ktorým Prevádzkovateľ poskytuje OÚ na základe zákona, odborní konzultanti a poradcovia ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-neutral-100" />

          <section className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground mb-4">Prenos do tretích krajín</h2>
            <p>
              Nitráčik o.z. neuskutočňuje osobne prenos OÚ do tretích krajín (mimo Európskej únie/Európskeho hospodárskeho priestoru), prenos však môže vykonávať poskytovateľ konkrétnej sociálnej siete.
            </p>
            <p>
              Facebook/Meta má uvedené, do ktorých tretích krajín sa vykonáva prenos, tu:{' '}
              <a href="https://about.fb.com/news/2021/03/steps-we-take-to-transfer-data-securely/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://about.fb.com/news/2021/03/steps-we-take-to-transfer-data-securely/
              </a>{' '}
              a tu:{' '}
              <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.facebook.com/privacy/policy
              </a>. Ide o krajiny, kde sa prenášajú osobné údaje na základe Rozhodnutia o primeranosti Európskej komisie a to Argentína, Izrael, Nový Zéland, Švajčiarsko a Spojené kráľovstvo. V prípade prenosu do USA je spoločnosť certifikovaná Data Privacy Framework (
              <a href="https://www.facebook.com/privacy/policies/data_privacy_framework/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.facebook.com/privacy/policies/data_privacy_framework/
              </a>), v prípade zvyšných tretích krajín má Facebook uzatvorené štandardné zmluvné doložky{' '}
              <a href="https://www.facebook.com/help/566994660333381?ref=dp" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.facebook.com/help/566994660333381?ref=dp
              </a>.
            </p>
            <p>
              Štandardné zmluvné doložky schválené rozhodnutím Európskej komisie (2010/87/EC z 5. februára 2010) a nové štandardné zmluvné doložky (modul 3) vložené do Európskeho dodatku spoločnosti Facebook k prenosom údajov ako aj doplňujúce opatrenia/{' '}
              <a href="https://www.facebook.com/legal/EU_data_transfer_addendum" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.facebook.com/legal/EU_data_transfer_addendum
              </a>{' '}
              vysvetlené tu:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-primary">
              <li>
                Vysvetlenie štandardných zmluvných doložiek/{' '}
                <a href="https://www.facebook.com/help/566994660333381" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                  https://www.facebook.com/help/566994660333381
                </a>
              </li>
              <li>
                Vysvetlenie prijatých doplňujúcich opatrení/{' '}
                <a href="https://about.fb.com/news/2021/03/steps-we-take-to-transfer-data-securely/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                  https://about.fb.com/news/2021/03/steps-we-take-to-transfer-data-securely/
                </a>
              </li>
              <li>
                Informácie pre orgány presadzovania práva/{' '}
                <a href="https://about.meta.com/actions/safety" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                  https://about.meta.com/actions/safety
                </a>
              </li>
              <li>
                Informácie o žiadostiach orgánov presadzovania práva k zákazníckym dátam/{' '}
                <a href="https://transparency.meta.com/reports/government-data-requests/?source=https%3A%2F%2Ftransparency.facebook.com%2Fgovernment-data-requests%2Fgov-additional-information" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                  https://transparency.meta.com/reports/government-data-requests/...
                </a>
              </li>
            </ul>
            <p>
              Nástroje prenosu podľa čl. 45 GDPR sa vzťahujú na spoločnosť Facebook/Meta. Zápis dovozcu údajov v EU-US Data Privacy Framework je možné overiť tu:{' '}
              <a href="https://www.dataprivacyframework.gov/s/participant-search/participant-detail?id=a2zt000000001L5AAI&status=Active" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://www.dataprivacyframework.gov/s/participant-search/participant-detail?id=a2zt000000001L5AAI&status=Active
              </a>. Rozhodnutie Európskej komisie k EU-US Data Privacy Framework_{' '}
              <a href="https://commission.europa.eu/system/files/2023-07/Adequacy%20decision%20EU-US%20Data%20Privacy%20Framework_en.pdf" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                https://commission.europa.eu/system/files/2023-07/Adequacy%20decision%20EU-US%20Data%20Privacy%20Framework_en.pdf
              </a>
            </p>
          </section>

          <hr className="border-neutral-100" />

          <section className="space-y-4">
            <p>
              Nitráčik o.z. nespracúva osobné údaje na účely vykonávania automatizovaného rozhodovania, vrátane profilovania.
            </p>
            <p>
              V prípade, ak je právnym základom pre spracúvanie OÚ zákon, poskytnutie týchto údajov je zákonnou požiadavkou. V prípade neposkytnutia týchto údajov, nie je možné zabezpečiť riadne plnenie povinností Nitráčik o.z., ktoré jej vyplývajú z príslušných všeobecných právnych predpisov.
            </p>
            <p>
              Nitráčik o.z. získava OÚ v prvom rade od dotknutých osôb alebo ich Nitráčik o.z. môže poskytnúť iný užívateľ. Ide o osobné údaje, ktoré sú zverejnené na fanpage prevádzkovateľa, a to najmä nick, meno, priezvisko, fotografia, osobné údaje zverejnené v príspevku a podobne.
            </p>
          </section>

          <hr className="border-neutral-100" />

          <section className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground mb-4">Práva dotknutých osôb</h2>
            <p className="mb-3">V súvislosti so spracovávaním osobných údajov má dotknutá osoba najmä nasledovné práva:</p>
            
            <div className="space-y-6">
              <div>
                <p className="mb-1"><strong className="text-foreground">1) Právo na prístup</strong></p>
                <p>Na základe žiadosti vyžadovať od spoločnosti Nitráčik o.z. potvrdenie, či sú alebo nie sú jej osobné spracúvané (prístup k osobným údajom), za akých podmienok, vrátane rozsahu, účelu a doby ich spracúvania, a informácie o zdroji získania dotknutých osobných údajov;</p>
              </div>

              <div>
                <p className="mb-1"><strong className="text-foreground">2) Právo na opravu</strong></p>
                <p>Na základe žiadosti vyžadovať od spoločnosti Nitráčik o.z. opravu nesprávnych alebo neaktuálnych osobných údajov, resp. doplnenie neúplných osobných údajov;</p>
              </div>

              <div>
                <p className="mb-2"><strong className="text-foreground">3) Právo na výmaz</strong></p>
                <p>Na základe žiadosti vyžadovať od spoločnosti Nitráčik o.z. vymazanie/likvidáciu osobných údajov ak:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-primary">
                  <li>osobné údaje už nie sú potrebné na účel, na ktorý sa získali alebo inak spracúvali,</li>
                  <li>v prípadoch, kedy boli osobné údaje spracovávané na základe súhlasu a tento súhlas so spracúvaním osobných údajov bol odvolaný, pričom neexistuje iný právný základ na spracúvanie osobných údajov alebo iná zákonná výnimka;</li>
                  <li>ak dotknutá osoba namieta spracúvanie osobných údajov na základe oprávneného záujmu a neprevažujú žiadne oprávnené dôvody na spracúvanie alebo dotknutá osoba namieta voči priamemu marketingu;</li>
                  <li>osobné údaje sú spracúvané nezákonne;</li>
                  <li>na to, aby sa splnila zákonná povinnosť, musia byť osobné údaje vymazané;</li>
                </ul>
              </div>

              <div>
                <p className="mb-2"><strong className="text-foreground">4) Právo na obmedzenie spracúvania</strong></p>
                <p>Na základe žiadosti vyžadovať od spoločnosti Nitráčik o.z. obmedzenie spracúvania osobných údajov ak:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 marker:text-primary">
                  <li>dotknutá osoba namieta správnosť osobných údajov, a to počas obdobia umožňujúceho spoločnosti Nitráčik o.z. overiť správnosť osobných údajov;</li>
                  <li>spracúvanie osobných údajov je nezákonné a dotknutá osoba namieta vymazanie osobných údajov a žiada namiesto toho obmedzenie ich použitia;</li>
                  <li>spoločnosť Nitráčik o.z. už nepotrebuje osobné údaje na účel spracúvania osobných údajov, ale potrebuje ich dotknutá osoba na uplatnenie právneho nároku;</li>
                </ul>
              </div>

              <div>
                <p className="mb-1"><strong className="text-foreground">5) Právo podať návrh</strong></p>
                <p>Podať návrh na začatie konania na Úrade na ochranu osobných údajov SR.</p>
              </div>
            </div>
          </section>

          <hr className="border-neutral-100" />

          <section className="space-y-4">
            <h2 className="text-2xl font-extrabold text-foreground mb-4">Právo namietať proti spracúvaniu osobných údajov</h2>
            <p>
              Proti spracúvaniu Vašich osobných údajov, ktoré je založené na našich oprávnených záujmoch, môžete kedykoľvek namietať, aj bez uvedenia dôvodov. Námietku musíme riadne posúdiť. Ak nepreukážeme, že máme na spracúvanie Vašich osobných údajov nevyhnutné oprávnené dôvody a že tieto prevažujú nad Vašimi záujmami, právami a slobodami, nebudeme Vaše osobné údaje ďalej spracúvať.
            </p>
            <p>
              Vašu námietku môžete zaslať písomne na adresu: Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901 alebo e-mailom na{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-primary font-bold hover:underline">gdpr@nitracik.sk</a>.
            </p>
          </section>

          <hr className="border-neutral-100" />

          <section className="space-y-4">
            <p>
              Podrobné informácie o jednotlivých právach dotknutých osôb a spôsobe ich uplatnenia sú uvedené na{' '}
              <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                https://nitracik.sk/
              </a>{' '}
              v časti Ochrana osobných údajov. Žiadosti v súvislosti s vyššie uvedenými právami je dotknutá osoba oprávnená uplatniť na adrese{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-primary font-bold hover:underline">gdpr@nitracik.sk</a>, resp. formou doporučeného listu doručeného prevádzkovateľovi – jeho zodpovednej osobe, prípadne osobne v sídle prevádzkovateľa.
            </p>
            <p>
              Odpovede na uvedené žiadosti dotknutej osoby alebo opatrenia prijaté na základe týchto žiadostí sa poskytujú bezodplatne. Ak je žiadosť dotknutej osoby zjavne neopodstatnená alebo neprimeraná, najmä pre jej opakujúcu sa povahu (opakovaná žiadosť), prevádzkovateľ má právo účtovať si poplatok zohľadňujúci jej administratívne náklady na poskytnutie informácií alebo primeraný poplatok zohľadňujúci jej administratívne náklady na oznámenie, resp. na uskutočnenie požadovaného opatrenia alebo má právo odmietnuť na základe takejto žiadosti konať.
            </p>
            <p>
              V prípade pochybností o dodržiavaní povinností súvisiacich so spracúvaním osobných údajov sa môžete obrátiť priamo na prevádzkovateľa, a to u zodpovednej osoby na adrese{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-primary font-bold hover:underline">gdpr@nitracik.sk</a>. Zároveň máte právo obrátiť sa so sťažnosťou na Úrad na ochranu osobných údajov Slovenskej republiky, so sídlom Budova Park one, Námestie 1. mája 18, 811 06 Bratislava, e-mail:{' '}
              <a href="mailto:statny.dozor@pdp.gov.sk" className="text-primary font-bold hover:underline">statny.dozor@pdp.gov.sk</a>, www:{' '}
              <a href="https://dataprotection.gov.sk/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                https://dataprotection.gov.sk/
              </a>.
            </p>
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

      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-elevated border border-neutral-200 text-foreground transition-all hover:bg-neutral-50 hover:-translate-y-1"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}
    </section>
    </div>
  );
};

export default SocialNetworksInfo;