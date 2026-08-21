import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronUp, ShieldCheck, Cookie, FileText } from 'lucide-react';

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
    <div className="relative w-full bg-white">
      <section className="py-12 md:py-16 container-custom max-w-4xl mx-auto px-4 sm:px-6 relative">
      <div className="bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md p-8 sm:p-12 md:p-16 relative overflow-hidden" style={{ isolation: 'isolate' }}>
        <FlakCream className="absolute pointer-events-none" style={{ width: 200, top: 10, right: -25, opacity: 0.32, zIndex: -1, transform: 'rotate(25deg)' }} />
        <FlakPink className="absolute pointer-events-none" style={{ width: 175, bottom: 10, left: -18, opacity: 0.35, zIndex: -1, transform: 'rotate(-30deg)' }} />
        <div className="mb-8">
          <Link 
            to="/gdpr" 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-neutral-200 bg-white text-foreground font-bold hover:bg-neutral-50 transition-all text-sm no-underline shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Späť na GDPR</span>
          </Link>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-8 text-center border-b border-neutral-100 pb-6 tracking-tight leading-snug">
          Podmienky a informácie o spracovávaní osobných údajov - Cookies https://nitracik.sk/
        </h1>

        <div className="space-y-6 text-neutral-600 leading-relaxed text-base font-medium">

          {showScrollButton && (
            <button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-elevated border border-neutral-200 text-foreground transition-all hover:bg-neutral-50 hover:-translate-y-1"
              aria-label="Scroll to top"
            >
              <ChevronUp className="h-6 w-6" />
            </button>
          )}

          <section>
            <p>
              Občianske združenie Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901, IČO: 56374453, DIČ: 2122328791 zapísaná v Registri mimovládnych neziskových organizácií, reg. č.: VVS/1-900/90-70205 (ďalej len "občianske združenie" alebo "prevádzkovateľ" alebo „Nitráčik o.z.") ako prevádzkovateľ získava a spracúva osobné údaje dotknutých osôb, ktorým týmto poskytuje informácie v zmysle Nariadenia Európskeho parlamentu a Rady (EÚ) 2016/679 z 27.04.2016 o ochrane fyzických osôb pri spracúvaní osobných údajov a o voľnom pohybe takýchto údajov, ktorým sa zrušuje smernica 95/46/ES ("GDPR" alebo „Nariadenie").
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-4">Čo sú cookies?</h2>
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
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-4">Správa súhlasu s cookies</h2>
            <p>
              O súhlas s používaním cookies vás žiadame prostredníctvom našej cookie lišty, ktorej spravovanie a zrozumiteľnosť sme sa snažili prispôsobiť používateľom našej webovej stránky. Na úvodnej strane cookies lišty (prvá vrstva) vám poskytujeme stručné a základné informácie k spracúvaniu cookies na našej webovej stránke. Sú vám ponúknuté možnosti spravovania zberu cookies.
            </p>
            <p className="mt-4">
              Ak si však neželáte, aby došlo k používaniu všetkých cookies na našej webovej stránke, máte možnosť v rámci prvej vrstvy cookie lišty kliknúť na tlačidlo <strong className="text-foreground">NASTAVIŤ COOKIES</strong>, ktoré vás presunie do druhej vrstvy našej cookie lišty. V rámci druhej vrstvy je možné oboznámiť s druhmi účelov a zvoliť si len tie účely na ktoré nám súhlas udelíte a kliknúť na tlačidlo <strong className="text-foreground">ULOŽIŤ VÝBER</strong>, alebo jedným tlačidlom <strong className="text-foreground">PRIJAŤ VŠETKY</strong> udeliť súhlas na všetky cookies nachádzajúce sa na našej webovej stránke, ale kliknúť na tlačidlo <strong className="text-foreground">ODMIETNUŤ VŠETKY</strong> a vtedy budeme spracúvať iba nevyhnutné cookies. Veríme, že takýto manažment preferencií je pre každého používateľa našej webovej stránky vyhovujúci.
            </p>
            <p className="mt-4">
              V rámci prvej vrstvy cookie lišty máte možnosť kliknúť na tlačidlo <strong className="text-foreground">ODMIETNUŤ VŠETKY</strong> a vtedy budeme spracúvať iba nevyhnutné cookies, alebo kliknúť na tlačidlo <strong className="text-foreground">PRIJAŤ VŠETKY</strong> a udeliť nám súhlas, aby sme o vás spracúvali všetky cookies, ktoré sa nachádzajú na našej stránke.
            </p>
          </section>

          <section>
            <p>
              Podľa druhu vzťahu s prevádzkovateľom sú v tabuľke nižšie uvedené účely spracovania osobných údajov (ďalej len "OÚ") z ktorých je zrejmá kategória dotknutých osôb, právny základ na ich spracúvanie, kategórie spracúvaných OÚ ako aj doba, po ktorú bude prevádzkovateľ tieto OÚ spracovávať.
            </p>
          </section>

          <section>
            <div className="overflow-x-auto rounded-2xl border border-neutral-200">
              <table className="min-w-full border-collapse text-xs sm:text-sm">
                <thead className="bg-neutral-50 text-foreground font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="border-b border-neutral-200 px-4 py-3 text-left">Účel spracúvania osobných údajov</th>
                    <th className="border-b border-neutral-200 px-4 py-3 text-left">Právny základ spracúvania osobných údajov</th>
                    <th className="border-b border-neutral-200 px-4 py-3 text-left">Kategória dotknutých osôb</th>
                    <th className="border-b border-neutral-200 px-4 py-3 text-left">Doba spracúvania OÚ</th>
                    <th className="border-b border-neutral-200 px-4 py-3 text-left">Príjemcovia alebo kategória príjemcov</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  <tr>
                    <td className="border-r border-neutral-100 px-4 py-3">
                      <strong className="text-foreground">TECHNICKÉ COOKIES (NEVYHNUTNÉ)</strong><br/>
                      Účelom spracúvania osobných údajov je prenos alebo uľahčenie prenosu správy prostredníctvom siete, alebo ak je to bezpodmienečne potrebné pre prevádzkovateľa ako poskytovateľa služieb informačnej spoločnosti na poskytovanie služby informačnej spoločnosti, ktorú výslovne požaduje užívateľ
                    </td>
                    <td className="border-r border-neutral-100 px-4 py-3">
                      spracúvanie je v zmysle čl. 6 ods. 1 písm. f) Nariadenia – OPRÁVNENÝ ZÁUJEM, ktorý sleduje prevádzkovateľ a vyplývajúci mu z § 108 ods. 9 zákona č. 452/2021 Z. z. o elektronických komunikáciách<br/><br/>
                      Oprávneným záujmom je: technické uloženiu údajov alebo prístupu k nim, za účelom prenosu alebo uľahčenia prenosu správy prostredníctvom siete, alebo ak je to bezpodmienečne potrebné pre poskytovateľa služieb informačnej spoločnosti na poskytovanie služby informačnej spoločnosti, ktorú výslovne požaduje užívateľ.
                    </td>
                    <td className="border-r border-neutral-100 px-4 py-3">Návštevníci webových stránok</td>
                    <td className="border-r border-neutral-100 px-4 py-3">Konkrétne lehoty a účel jednotlivej cookie nájdete v druhej vrstve cookie lišty, po kliknutí na Technické cookies (Nevyhnutné)</td>
                    <td className="px-4 py-3">subjekty, ktorým prevádzkovateľ poskytuje osobné údaje na základe zákona; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti;</td>
                  </tr>
                  <tr>
                    <td className="border-r border-neutral-100 px-4 py-3">
                      <strong className="text-foreground">ANALYTICKÉ COOKIES</strong><br/>
                      Účelom spracúvania osobných údajov analytických cookies je umožniť prevádzkovateľovi rozpoznať a spočítať počet návštevníkov stránok a získať informácie o tom, ako sa webová stránka používa (napr. ktoré stránky najčastejšie otvára dotknutá osoba a či dotknutá osoba od niektorých stránok dostáva chybové hlásenia). To prevádzkovateľovi pomáha zlepšiť spôsob, akým funguje jej webová stránka, napríklad tým, že dotknutá osoba môže ľahko nájsť to, čo hľadá.
                    </td>
                    <td className="border-r border-neutral-100 px-4 py-3">čl. 6 ods. 1 písm. a) GDPR – súhlas dotknutej osoby</td>
                    <td className="border-r border-neutral-100 px-4 py-3">Návštevníci webových stránok</td>
                    <td className="border-r border-neutral-100 px-4 py-3">Konkrétne lehoty a účel jednotlivej cookie nájdete v druhej vrstve cookie lišty, po kliknutí na Analytické cookies</td>
                    <td className="px-4 py-3">subjekty, ktorým prevádzkovateľ poskytuje osobné údaje na základe zákona; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti; spoločność Google poskytujúca Google Analytics t.z. analytické nástroje;</td>
                  </tr>
                  <tr>
                    <td className="border-r border-neutral-100 px-4 py-3">
                      <strong className="text-foreground">UPLATNENIE PRÁV DOTKNUTEJ OSOBY</strong><br/>
                      Účelom spracúvania OÚ je uplatňovanie práv dotknutých osôb podľa GDPR. (tento účel sa vzťahuje na prípady, keď dôjde k uplatneniu Vašich práv podľa GDPR)
                    </td>
                    <td className="border-r border-neutral-100 px-4 py-3">spracúvanie je v zmysle čl. 6 ods. 1 písm. c) Nariadenia nevyhnutné na splnenie zákonnej povinnosti prevádzkovateľa vyplývajúcej z nariadenia a zo zákona č. 18/2018 Z. z.</td>
                    <td className="border-r border-neutral-100 px-4 py-3">fyzické osoby uplatňujúce svoje práva ako dotknuté osoby</td>
                    <td className="border-r border-neutral-100 px-4 py-3">5 rokov nasledujúcich po roku, v ktorom bola žiadosť vybavená</td>
                    <td className="px-4 py-3">subjekty, ktorým prevádzkovateľ poskytuje osobné údaje na základe zákona; odborní konzultanti a poradcovia, ktorí sú viazaní zákonnou a/alebo zmluvnou povinnosťou mlčanlivosti; spoločnosť Google poskytujúca dátové úložisko Google Disk, Google email a ďalšie nástroje Google Workspace služby;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-4">Osobitne k službám tretích strán, ktoré používame na analytické, štatistické účely</h2>
            
            <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-3 mt-6">Služba Google Analytics od spoločnosti Google</h3>
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
              <a href="https://www.google.com/analytics/terms/gb.html" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                https://www.google.com/analytics/terms/gb.html
              </a>.
            </p>
            <p className="mt-4">
              Všeobecný prehľad o zásadách zabezpečenia a ochrany súkromia v Google Analytics je dostupný tu:{' '}
              <a href="https://support.google.com/analytics/answer/6004245?hl=sk" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                https://support.google.com/analytics/answer/6004245?hl=sk
              </a>, a taktiež politika o ochrane súkromia spoločnosti Google je dostupná tu:{' '}
              <a href="https://policies.google.com/privacy?hl=sk" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                https://policies.google.com/privacy?hl=sk
              </a>.
            </p>
            <p className="mt-4">
              Prosím vezmite na vedomie, že spoločnosť Google môže spracúvať OÚ aj v tretej krajine. Prenos do tretích krajín nie je teda v rámci tejto služby vylúčený. Pre prípad prenosu do tretích krajín sú ako vhodné záruky prijaté štandardné zmluvné doložky v súlade s článkom 46 Nariadenia.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-4">Všeobecne k spracúvaniu OÚ v súvislosti s COOKIES</h2>
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
              <a href="https://workspace.google.com/intl/en/terms/subprocessors.html" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
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
              <strong className="text-foreground">Zdroj:</strong> Vaše osobné údaje máme iba od Vás a prípadne ich vytvoril prevádzkovateľ ako napr. dátum návštevy stránky a zvolené preferencie.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-4">Práva dotknutých osôb</h2>
            <p className="mb-4">V súvislosti so spracúvaním OÚ má dotknutá osoba najmä nasledovné práva:</p>
            
            <div className="space-y-4">
              <div>
                <p><strong className="text-foreground">1) Právo na prístup k osobným údajom</strong></p>
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
                <p><strong className="text-foreground">2) Právo na opravu</strong></p>
                <p>Na základe žiadosti vyžadovať od prevádzkovateľa opravu nesprávnych alebo neaktuálnych OÚ, resp. doplnenie neúplných OÚ (právo na opravu);</p>
              </div>

              <div>
                <p><strong className="text-foreground">3) Právo na výmaz</strong></p>
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
                <p><strong className="text-foreground">4) Právo na obmedzenie spracúvania</strong></p>
                <p>Na základe žiadosti vyžadovať od prevádzkovateľa obmedzenie spracúvania OÚ (právo na obmedzenie spracúvania), ak:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>dotknutá osoba napadne správnosť OÚ, a to počas obdobia umožňujúceho prevádzkovateľovi overiť správnosť OÚ;</li>
                  <li>spracúvanie OÚ je protizákonné a dotknutá osoba namieta proti vymazaniu OÚ a žiada namiesto toho obmedzenie ich použitia;</li>
                  <li>prevádzkovateľ už nepotrebuje OÚ na účely spracúvania OÚ, ale potrebuje ich dotknutá osoba na preukázanie, uplatňovanie alebo obhajovanie právnych nárokov;</li>
                  <li>dotknutá osoba namietala voči spracúvaniu podľa článku 21 ods. 1 GDPR, a to až do overenia, či oprávnené dôvody na strane prevádzkovateľa prevažujú nad oprávnenými dôvodmi dotknutej osoby;</li>
                </ul>
              </div>

              <div>
                <p><strong className="text-foreground">5) Právo na prenosnosť OÚ</strong></p>
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
                <p><strong className="text-foreground">6) Právo podať návrh</strong></p>
                <p>Podať návrh na začatie konania na Úrade na ochranu osobných údajov SR;</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground mb-4">Právo odvolať súhlas so spracúvaním osobných údajov</h2>
            <p>
              Vaše odvolanie súhlasu môžete poslať osobne alebo poštou na Nitráčik o.z., so sídlom na Hydinárska 13A Nitra 94901 alebo e-mailom na{' '}
              <a href="mailto:gdpr@nitracik.sk" className="text-primary font-bold hover:underline">gdpr@nitracik.sk</a>.
            </p>
            <p className="mt-4">
              Ako sme spomínali vyššie Váš súhlas so spracúvaním osobných údajov môžete odvolať aj prostredníctvom cookie lišty. Ku cookie lište sa dostanete prostredníctvom kliknutia na tlačidlo (button) „Nastavenia cookies" na spodnej lište na webovej stránke{' '}
              <a href="https://nitracik.sk/" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                https://nitracik.sk/
              </a>, a tak môžete zmeniť svoje rozhodnutie, ktoré sa týka cookies (napr. odvolať súhlas). Súbory cookies môžete tiež zablokovať alebo odstrániť prostredníctvom internetového prehliadača.
            </p>
          </section>

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

          <section className="text-right text-neutral-400 italic pt-6 border-t border-neutral-100 font-bold text-sm">
            <p>V Nitre dňa 18.02.2026</p>
          </section>
        </div>
      </div>
    </section>
    </div>
  );
};

export default CookiesInfo;