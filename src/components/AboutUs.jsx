// Updated AboutUs.jsx - REFINED LAYOUT & SOFTER CARDS
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';
import { Button, Modal, Form, Alert } from 'react-bootstrap';
import api from '../api/api';
import Blog from './Blog';
import ownerImageDesktop from '../assets/owner.jpg';
import ownerImageMobile from '../assets/owner2.jpg';
import googleIcon from '../assets/google_icon.png';
import mascotImage from '../assets/logo_bez.PNG';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Info, 
  ArrowRight,
  MessageCircle,
  ExternalLink,
  Gift
} from 'lucide-react';
import GiftCertificate from './GiftCertificate';

// Statické obrázky pre flaky - lepší výkon na iOS (cachovateľné)
const FlakPink = ({ className, style }) => (
  <img 
    src="/images/flak-pink.svg" 
    alt="" 
    aria-hidden="true"
    loading="lazy"
    decoding="async"
    className={className} 
    style={{ ...style, pointerEvents: 'none' }}
  />
);

const FlakCream = ({ className, style }) => (
  <img 
    src="/images/flak-cream.svg" 
    alt="" 
    aria-hidden="true"
    loading="lazy"
    decoding="async"
    className={className} 
    style={{ ...style, pointerEvents: 'none' }}
  />
);

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const getColorFromName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
};

const getAvatarDataUri = (name = '') => {
  const initials = getInitials(name);
  const bg = getColorFromName(name);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
      <rect width="80" height="80" rx="40" fill="${bg}" />
      <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="32" fill="#fff" font-weight="700">${initials}</text>
    </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// --- FRAMER MOTION VARIANTS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const AboutUs = () => {
  const { t } = useTranslation();
  const carouselText = t?.about?.carousel || [];
  const carouselItems = [
    {
      id: 1,
      image: '/images/carousel/IMG_3244.JPG',
      title: carouselText[0]?.title || 'Svet plný farieb',
      description: carouselText[0]?.description || 'Každý dotyk, odtieň a úsmev premieňame na dobrodružstvo.',
    },
    {
      id: 2,
      image: '/images/carousel/IMG_3268.jpg',
      objectPosition: 'center',
      title: carouselText[1]?.title || 'Zážitok aj pre rodičov',
      description: carouselText[1]?.description || 'Doprajte si príjemný oddych, zábavu a spoločný čas pri tvorení.',
    },
    {
      id: 3,
      image: '/images/carousel/IMG_3212.jpg',
      objectPosition: 'center',
      title: carouselText[2]?.title || 'Tvorenie pre malých aj veľkých',
      description: carouselText[2]?.description || 'Objavte aktivity, pri ktorých si oddýchnete a zabavíte sa spolu s deťmi.',
    },
    {
      id: 4,
      image: '/images/carousel/IMG_5500.jpg',
      title: carouselText[3]?.title || 'Bezpečné prostredie',
      description: carouselText[3]?.description || 'Bez správnych a nesprávnych odpovedí, iba s chuťou skúšať.',
    },
    {
      id: 5,
      image: '/images/carousel/IMG_3256.JPG',
      title: carouselText[4]?.title || 'Spolu je najlepšie',
      description: carouselText[4]?.description || 'Zdieľané chvíle, ktoré zostanú v detskej aj rodičovskej pamäti.',
    },
    {
      id: 6,
      image: '/images/carousel/IMG_3257.JPG',
      title: carouselText[5]?.title || 'Hra, ktorá rozvíja',
      description: carouselText[5]?.description || 'Nenápadne trénujeme sústredenie, motoriku aj odvahu.',
    },
    {
      id: 7,
      image: '/images/carousel/IMG_3293.jpg',
      title: carouselText[6]?.title || 'Oddych a zábava pre celú rodinu',
      description: carouselText[6]?.description || 'Aj dospelí si u nás nájdu priestor na relax, hru a nové zážitky.',
    },
    {
      id: 8,
      image: '/images/carousel/6E9A8291.JPEG',
      title: carouselText[7]?.title || 'Bezstarostné šantenie',
      description: carouselText[7]?.description || 'Bezpečné miesto, kde sa deti môžu smiať, skúmať a byť samy sebou.',
    },
    {
      id: 9,
      image: '/images/carousel/IMG_3850.jpg',
      title: carouselText[8]?.title || 'Zvedavosť na prvom mieste',
      description: carouselText[8]?.description || 'Podnecujeme otázky, skúšanie a radosť z každého malého pokroku.',
    },
    {
      id: 10,
      image: '/images/carousel/IMG_4379.jpg',
      title: carouselText[9]?.title || 'Čas pre spoločné zážitky',
      description: carouselText[9]?.description || 'Vytvorte si spolu spomienky, ktoré budú hriať ešte dlho po návšteve.',
    },
    {
      id: 11,
      image: '/images/carousel/IMG_5300.jpg',
      title: carouselText[10]?.title || 'Nitráčik, kde detstvo žije',
      description: carouselText[10]?.description || 'Príďte si užiť priestor, v ktorom má detská radosť hlavné slovo.',
    },
    {
      id: 12,
      image: '/images/carousel/IMG_3251.JPG',
      objectPosition: 'center',
      title: carouselText[11]?.title || 'Pomoc je vždy po ruke',
      description: carouselText[11]?.description || 'Sme tu pre vás, keď potrebujete poradiť, pomôcť alebo niečo objasniť.',
    },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const touchStartXRef = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // User Context
  const { user } = useUser();
  const isLoggedIn = user.isLoggedIn;

  // Admin Logic
  const [isAdmin, setIsAdmin] = useState(false);
  const userId = localStorage.getItem('userId');

  // Stavy pre Google Ratings
  const [showGoogleRatingsModal, setShowGoogleRatingsModal] = useState(false);
  const [googleRatingsConfig, setGoogleRatingsConfig] = useState({
    businessId: '',
    enabled: false
  });

  // Stavy pre recenzie
  const [reviews, setReviews] = useState([]);
  const [reviewCarouselIndex, setReviewCarouselIndex] = useState(0);
  const [reviewCardsPerView, setReviewCardsPerView] = useState(3);
  const [googleRating, setGoogleRating] = useState(null);
  const [googleTotalRatings, setGoogleTotalRatings] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  // Stavy pre editovanie sekcii
  const [aboutContent, setAboutContent] = useState({
    title: 'Vitajte u nás! :)',
    description: 'Nitráčik je jedinečný priestor v srdci Nitry, ktorý vznikol zo spontánnej túžby dopriať deťom miesto pre slobodné objavovanie sveta všetkými zmyslami. Našou filozofiou je „hry bez zákazov“, kde sa deti môžu u nás bez obáv ufúľať, experimentovať s textúrami a určovať si vlastné tempo pri senzorických aktivitách. Prostredníctvom práce s materiálmi ako farebná ryža, sliz či jedlé blato hravou formou rozvíjame detskú jemnú motoriku, sústredenie a kreativitu. V našich priestoroch s rozlohou vyše 180 m² vytvárame pokojnú a bezpečnú atmosféru podporenú relaxačnou hudbou, ktorá je ideálna pre hlboký rozvoj detského vnímania.',
    description2: 'Nitráčik nie je len obyčajná hernička, ale komunita založená na radosti z objavovania, kde každé dieťa prekonáva svoje hranice a buduje si zdravé sebavedomie. Veríme, že tie najkrajšie detské zážitky sú tie, ktoré si môžu doslova „ohmatať“ a zažiť na vlastnej koži.',
  });

  const [showAboutEditModal, setShowAboutEditModal] = useState(false);
  const [editAboutForm, setEditAboutForm] = useState({ ...aboutContent });
  const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });

  // Admin Check
  const checkAdminStatus = useCallback(async () => {
    if (!userId || !user.isLoggedIn) return;
    try {
      const response = await api.get(`/api/users/${userId}`);
      if (response.data.role === 'admin' || localStorage.getItem('userRole') === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Admin check failed:', error);
      setIsAdmin(false);
    }
  }, [userId, user.isLoggedIn]);

  // Load Data Effect
  useEffect(() => {
    const loadData = async () => {
      try {
        if (userId && user.isLoggedIn) {
          await checkAdminStatus();
        } else {
          setIsAdmin(false);
        }

        try {
          const reviewsRes = await api.get('/api/reviews');
          setReviews(reviewsRes.data.reviews || []);
          setGoogleRating(typeof reviewsRes.data.rating === 'number' ? reviewsRes.data.rating : null);
          setGoogleTotalRatings(typeof reviewsRes.data.totalRatings === 'number' ? reviewsRes.data.totalRatings : null);
          setGoogleRatingsConfig((prev) => ({
            ...prev,
            enabled: !!reviewsRes.data.enabled,
            businessId: reviewsRes.data.businessId || prev.businessId
          }));
        } catch (err) {
          console.error("Nepodarilo sa načítať recenzie:", err);
        }

        try {
          const aboutRes = await api.get('/api/about-content');
          if (aboutRes.data) {
            setAboutContent(aboutRes.data);
          }
        } catch (err) {
          console.error("Nepodarilo sa načítať obsah O nás:", err);
        }
      } catch (error) {
        console.error('General fetch error:', error);
      }
    };
    loadData();
  }, [userId, user.isLoggedIn, checkAdminStatus]);

  // Responsive Carousel
  useEffect(() => {
    const updateCardsPerView = () => {
      const width = window.innerWidth;
      if (width < 640) setReviewCardsPerView(1);
      else if (width < 1024) setReviewCardsPerView(2);
      else setReviewCardsPerView(3);
    };
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  // Scroll to top
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollButton(window.scrollY > 300);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load Admin Config
  useEffect(() => {
    const loadAdminConfig = async () => {
      if (isAdmin && user.isLoggedIn) {
        try {
          const configRes = await api.get('/api/admin/google-ratings');
          setGoogleRatingsConfig(configRes.data);
        } catch (err) {
          console.error("Nepodarilo sa načítať admin config:", err);
        }
      } else {
        setGoogleRatingsConfig({ businessId: '', enabled: false });
      }
    };
    loadAdminConfig();
  }, [isAdmin, user.isLoggedIn]);

  // Functions
  const handleSaveAboutContent = async () => {
    try {
      await api.post('/api/admin/about-content', editAboutForm);
      setAboutContent(editAboutForm);
      setShowAboutEditModal(false);
      setAlertMessage({ type: 'success', text: 'Obsah sekcie bol úspešne uložený.' });
      setTimeout(() => setAlertMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving about content:', error);
      setAlertMessage({ type: 'error', text: 'Nepodarilo sa uložiť obsah.' });
    }
  };

  const handleGoogleRatingsSave = async () => {
    try {
      await api.post('/api/admin/google-ratings', googleRatingsConfig);
      setShowGoogleRatingsModal(false);
      setAlertMessage({ type: 'success', text: 'Konfigurácia Google recenzií bola uložená.' });
      setTimeout(() => setAlertMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving Google ratings config:', error);
      setAlertMessage({ type: 'error', text: 'Nepodarilo sa uložiť konfiguráciu.' });
    }
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  }, [carouselItems.length]);

  const prevSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1));

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) nextSlide();
      else prevSlide();
    }
    setDragOffset(0);
    setIsDragging(false);
    touchStartXRef.current = null;
  };

  const handleJoinClick = (e) => {
    if (user.isLoggedIn) {
      e.preventDefault();
      e.stopPropagation();
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    }
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000); 
    return () => clearInterval(timer);
  }, [currentSlide, nextSlide]);

  useEffect(() => {
    if (showAboutEditModal) {
      setEditAboutForm({ ...aboutContent });
    }
  }, [showAboutEditModal, aboutContent]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reviewGapRem = reviewCardsPerView === 1 ? 1 : reviewCardsPerView === 2 ? 1.5 : 2;

  return (
    <div className="relative w-full bg-white">
      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-elevated border border-neutral-200 text-foreground transition-all hover:bg-neutral-50 hover:-translate-y-1"
            aria-label="Scroll to top"
          >
            <ChevronLeft className="h-6 w-6 rotate-90" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Alerts */}
      <AnimatePresence>
        {alertMessage.text && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="container-custom mt-6 mb-6"
          >
            <Alert variant={alertMessage.type === 'success' ? 'success' : 'danger'} className="rounded-xl shadow-sm border-0">
              {alertMessage.text}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Carousel */}
      <section className="section-wrapper container-custom !py-8">
        <div
          className="relative w-full h-[450px] lg:h-[900px] overflow-hidden rounded-[2rem] shadow-sm group border border-neutral-200"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`flex h-full ${isDragging ? '' : 'transition-transform duration-500 ease-out'}`}
            style={{ transform: `translateX(calc(-${currentSlide * 100}% + ${dragOffset}px))`, willChange: 'transform' }}
          >
            {carouselItems.map((item, idx) => (
              <div key={item.id} className="relative w-full h-full flex-shrink-0 bg-white">
                <img
                  src={item.image}
                  alt={item.title}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="object-cover w-full h-full will-change-transform"
                  style={{ transform: 'translateZ(0)', objectPosition: item.objectPosition || 'top' }}
                  onError={(e) => {
                    e.target.src = `https://picsum.photos/1200/500?random=${item.id}`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 sm:p-12">
                  <AnimatePresence mode="wait">
                    {currentSlide === idx && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                      >
                        <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">{item.title}</h3>
                        <p className="text-white/90 text-lg sm:text-xl max-w-2xl">{item.description}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 flex items-center justify-center text-white transition-colors duration-200 hover:text-neutral-200"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 flex items-center justify-center text-white transition-colors duration-200 hover:text-neutral-200"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </section>

      {/* About Us Text Section - SOFTER CARD & NEW LAYOUT */}
      <section className="section-wrapper container-custom !py-8">
        <div className="relative">
          <img
            src={mascotImage}
            alt=""
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 sm:w-24 z-20 pointer-events-none"
            style={{ filter: 'drop-shadow(2px 4px 12px rgba(0,0,0,0.12))' }}
          />
          <div className="bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md p-8 sm:p-12 relative overflow-hidden">
          {/* Flak dekorácie */}
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 200, top: -40, left: -30, opacity: 0.38, transform: 'rotate(-25deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 180, top: -35, right: -25, opacity: 0.4, transform: 'rotate(30deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 190, top: '25%', left: -20, opacity: 0.33, transform: 'rotate(15deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 180, top: '50%', right: -25, opacity: 0.35, transform: 'rotate(-20deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 200, bottom: -35, left: '35%', opacity: 0.35, transform: 'rotate(45deg)' }} />
          
          {/* Centered Heading at the top */}
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-10 text-foreground">
              {aboutContent.title}
            </h2>
          </div>

          {/* Text and Image side by side */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Image Block */}
            <div className="order-2 lg:order-1 relative rounded-[1.5rem] overflow-hidden min-h-[300px] lg:min-h-full shadow-sm border border-neutral-100">
              <img
                src="/images/IMG_5337.jpg"
                alt="Children enjoying activities at Nitracik"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'translateZ(0)' }}
                onError={(e) => {
                  e.target.src = 'https://picsum.photos/600/400?random=about';
                }}
              />
            </div>

            {/* Text Block */}
            <div className="order-1 lg:order-2 flex flex-col justify-center">
              <div className="text-base sm:text-lg leading-relaxed text-neutral-600 space-y-5 text-justify">
                <p>{aboutContent.description}</p>
                <p>{aboutContent.description2}</p>
              </div>
              
              {isAdmin && (
                <div className="mt-8 text-right">
                  <button
                    onClick={() => setShowAboutEditModal(true)}
                    className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editovať text
                  </button>
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Google Ratings Section - REFINED SPACING & STARS */}



      <section className="section-wrapper container-custom !py-8">
        <div className="relative">
          <img
            src={mascotImage}
            alt=""
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 sm:w-24 z-20 pointer-events-none"
            style={{ filter: 'drop-shadow(2px 4px 12px rgba(0,0,0,0.12))' }}
          />
          <div className="bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md p-8 sm:p-12 relative overflow-hidden">
          {/* Flak dekorácie */}
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 200, top: -45, right: -35, opacity: 0.4, transform: 'rotate(35deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 170, top: -35, left: -25, opacity: 0.36, transform: 'rotate(-20deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 190, top: '35%', left: -20, opacity: 0.35, transform: 'rotate(-15deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 180, top: '55%', right: -25, opacity: 0.36, transform: 'rotate(25deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 200, bottom: -40, left: '30%', opacity: 0.38, transform: 'rotate(-35deg)' }} />
          <div className="relative z-10 text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
              Napísali ste o nás
            </h2>
            
            {/* Pill shaped Google Rating summary */}
            <div className="flex justify-center items-center gap-3 mb-4 bg-white shadow-sm border border-neutral-200 inline-flex px-6 py-2.5 rounded-full">
              <span className="text-foreground font-extrabold text-xl">
                {typeof googleRating === 'number' ? googleRating.toFixed(1).replace('.', ',') : '5,0'}
              </span>
              <div className="flex gap-1">
                {typeof googleRating === 'number'
                  ? [...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 stroke-[1.5px] ${i < Math.round(googleRating) ? 'fill-yellow-400 text-neutral-700' : 'fill-transparent text-neutral-300'}`} />
                    ))
                  : [...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-neutral-700 stroke-[1.5px]" />)
                }
              </div>
              <div className="w-px h-6 bg-neutral-200 mx-1"></div>
              <a
                href="https://www.google.com/search?q=oz+nitracik"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-neutral-600 hover:text-foreground transition-colors flex items-center gap-1"
              >
                {typeof googleTotalRatings === 'number' ? googleTotalRatings : ''} recenzií
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>

            <p className="flex items-center justify-center gap-2 text-sm text-neutral-500 font-bold">
              <img src={googleIcon} alt="Google" className="w-6 h-6" />
              Overené recenzie z Google
            </p>
          </div>

          <div className="relative px-0 sm:px-8 mt-2">
            {reviews.length > 0 ? (
              <div className="relative">
                {reviewCarouselIndex > 0 && (
                  <button
                    onClick={() => setReviewCarouselIndex((prev) => Math.max(0, prev - 1))}
                    className="absolute -left-4 sm:-left-8 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center text-foreground transition-all hover:scale-110"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}

                <div className="overflow-hidden py-2">
                  <div
                    className="flex items-start transition-transform duration-300 ease-out"
                    style={{
                      gap: `${reviewGapRem}rem`,
                      transform: `translateX(calc(-${reviewCarouselIndex} * ((100% - ${(reviewCardsPerView - 1) * reviewGapRem}rem) / ${reviewCardsPerView} + ${reviewGapRem}rem)))`,
                      willChange: 'transform',
                    }}
                  >
                    {reviews.slice(0, 5).map((review, index) => (
                      <div
                        key={index}
                        className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex-shrink-0 cursor-pointer flex flex-col transition-all duration-300 hover:shadow-md"
                        style={{ width: `calc((100% - ${(reviewCardsPerView - 1) * reviewGapRem}rem) / ${reviewCardsPerView})` }}
                        onClick={() => setSelectedReview(review)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={review.profile_photo_url || getAvatarDataUri(review.author_name)}
                              alt=""
                              className="w-10 h-10 rounded-full border border-neutral-100"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = getAvatarDataUri(review.author_name);
                              }}
                            />
                            <div>
                              <h4 className="font-bold text-foreground text-sm">{review.author_name}</h4>
                              {review.relative_time_description && (
                                <span className="text-neutral-500 text-xs block mt-0.5 font-medium">
                                  {review.relative_time_description}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 stroke-[1.5px] ${i < review.rating ? 'fill-yellow-400 text-neutral-700' : 'fill-transparent text-neutral-300'}`} />
                          ))}
                        </div>
                        <p className="text-neutral-600 text-sm leading-relaxed relative text-justify">
                          "{review.text.length > 150 ? review.text.substring(0, 150) + '...' : review.text}"
                          {review.text.length > 150 && (
                            <span className="text-primary font-bold ml-1 inline-block">
                              viac
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {reviewCarouselIndex < reviews.slice(0, 5).length - reviewCardsPerView && (
                  <button
                    onClick={() => setReviewCarouselIndex((prev) => Math.min(reviews.slice(0, 5).length - reviewCardsPerView, prev + 1))}
                    className="absolute -right-4 sm:-right-8 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white shadow-md border border-neutral-100 flex items-center justify-center text-foreground transition-all hover:scale-110"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                {googleRatingsConfig.enabled ? (
                  <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-200 inline-block max-w-md mx-auto">
                    <MessageCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600 font-medium mb-6">Zatiaľ sa nepodarilo načítať recenzie, ale nájdete nás na Google.</p>
                    <a
                      href={`https://search.google.com/local/reviews?placeid=${googleRatingsConfig.businessId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-600"
                    >
                      Zobraziť na Google Maps
                    </a>
                  </div>
                ) : (
                  <p className="text-neutral-500 font-medium">Recenzie momentálne nie sú k dispozícii.</p>
                )}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-center">
              <button
                onClick={() => setShowGoogleRatingsModal(true)}
                className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t?.about?.configureGoogleReviews || 'Konfigurovať Google recenzie'}
              </button>
            </div>
          )}
          </div>
        </div>
      </section>

      {/* Gift Card Section */}
      <section className="section-wrapper container-custom !py-8">
        <div className="bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md p-6 sm:p-8 relative overflow-hidden">
          {/* Flak dekorácie */}
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 180, top: -35, left: '30%', opacity: 0.36, transform: 'rotate(20deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 200, top: -30, right: -30, opacity: 0.4, transform: 'rotate(-25deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 170, top: '25%', left: -20, opacity: 0.33, transform: 'rotate(35deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 200, top: '50%', right: -25, opacity: 0.37, transform: 'rotate(-10deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 180, bottom: -35, right: '30%', opacity: 0.35, transform: 'rotate(-30deg)' }} />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6 w-full">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-extrabold tracking-widest uppercase mb-4">
                  <Gift className="w-3.5 h-3.5" />
                  Darčekový poukaz
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-foreground">
                  Darujte zážitok na celý život 🎁
                </h2>
                <p className="text-neutral-600 text-base sm:text-lg leading-relaxed mb-6">
                  Premeníte obyčajný deň na nezabudnuteľné dobrodružstvo plné smiechu, 
                  objavovania a radosti. Darčekový poukaz do Nitráčika je vstupenkou do 
                  sveta kreatívneho hrania, kde deti môžu byť samy sebou – ufúľané, 
                  šťastné a slobodné.
                </p>
                <p className="text-neutral-500 text-sm sm:text-base leading-relaxed">
                  Darujte radosť svojim najbližším či kamarátom. V Nitráčiku nájdete
                  aktivity nielen pre tých najmenších, ale aj pre dospelých – vďaka tomu
                  je poukaz ideálnym darčekom pre celú rodinu. Jednoduchý nákup online, 
                  doručenie emailom a platnosť až 12 mesiacov.
                </p>
              </div>
              {/* Darčekový poukaz - rovnaký na desktop aj mobile, automaticky sa škáluje */}
              <div className="flex-shrink-0 w-full max-w-[820px] mx-auto lg:mx-0 lg:flex-[0_0_700px]">
                <GiftCertificate
                  mode="preview"
                  amount={50}
                  recipientName="Barborku"
                  buyerEmail="Maťky"
                  message="Užite si krásny zážitok!"
                  expiresAt={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
                  code="VASKODNTRCK"
                  previewClassName="max-w-[820px]"
                  cardWidth={700}
                />
              </div>
            </div>
            <Link
              to="/gift-card"
              className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-full px-8 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 mt-4 lg:-mt-6"
            >
              <Gift className="w-5 h-5" />
              Kúpiť darčekový poukaz
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="section-wrapper container-custom !py-8">
        <div className="bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md p-8 sm:p-12 relative overflow-hidden">
          {/* Flak dekorácie */}
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 200, top: -40, left: -30, opacity: 0.38, transform: 'rotate(-40deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 170, top: -30, right: -25, opacity: 0.36, transform: 'rotate(25deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 180, top: '30%', right: -20, opacity: 0.33, transform: 'rotate(-15deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 180, top: '50%', left: -20, opacity: 0.35, transform: 'rotate(10deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 190, bottom: -35, left: '40%', opacity: 0.35, transform: 'rotate(50deg)' }} />
          <div className="relative z-10">
          <Blog limit={3} showViewAll={true} />
          </div>
        </div>
      </section>

      {/* Owner Section */}
      <section className="section-wrapper container-custom !py-8">
        <div className="bg-white border-2 border-neutral-300 rounded-[2rem] shadow-md p-0 overflow-hidden relative">
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 180, top: -35, right: '25%', opacity: 0.33, transform: 'rotate(15deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 190, top: -30, left: -25, opacity: 0.38, transform: 'rotate(-30deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 170, top: '30%', right: -22, opacity: 0.34, transform: 'rotate(40deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 200, top: '55%', left: -25, opacity: 0.36, transform: 'rotate(-20deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 170, bottom: -35, left: '30%', opacity: 0.32, transform: 'rotate(-10deg)' }} />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 items-stretch">
            <div className="h-[400px] lg:h-auto relative">
              <picture>
                <source media="(min-width: 1024px)" srcSet={ownerImageDesktop} />
                <img
                  src={ownerImageMobile}
                  alt="Saška - Majiteľka Nitráčika"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  style={{ transform: 'translateZ(0)' }}
                  onError={(e) => {
                    e.target.src = 'https://picsum.photos/500/600?random=owner';
                  }}
                />
              </picture>
            </div>

            <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-extrabold tracking-widest uppercase mb-6 w-fit">
                Zakladateľka
              </div>
              <h2 className="text-4xl font-extrabold mb-6">
                Ahoj! Volám sa Saška.
              </h2>
              <div className="text-base sm:text-lg leading-relaxed text-neutral-600 space-y-4">
                <p>
                  Stojím za lokálnym projektom Nitráčik, ktorý od počiatku zahŕňam láskou,
                  nápadmi a tvorivou energiou. Úprimne verím a dúfam, že túto láskavú energiu
                  pocítiš nielen na webe, ale aj pri osobnom stretnutí na hodinách, v krásnych
                  priestoroch Nitráčika v srdci Nitry.
                </p>
                <blockquote className="border-l-4 border-primary pl-5 py-2 italic text-foreground font-bold my-8">
                  „Chcem aspoň trochou prispieť k tomu, aby bol tento svet lepším miestom pre život.. nielen pre môjho syna."
                </blockquote>
                <p>PREČO práve skrz Nitráčik o.z.? ..lebo je to:</p>
                <ul className="grid grid-cols-2 gap-3 mt-4 font-bold text-foreground">
                  <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary"></div> ZMYSLUPLNÉ</li>
                  <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary"></div> KREATÍVNE</li>
                  <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary"></div> BAVÍ MA TO</li>
                  <li className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-primary"></div> NAPĽŇA</li>
                </ul>
                <p className="mt-8">
                  Nitráčik je “niečo” čo som dlho hľadala a našla. Ďakujem, že si jeho súčasťou a podporuješ ho v jeho raste. 🤍
                </p>
              </div>

              <div className="mt-10">
                <Link
                  to="/contact"
                  onClick={() => setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 80)}
                  className="inline-flex items-center justify-center rounded-full border-2 border-neutral-200 bg-white px-6 py-3 text-sm font-bold text-foreground transition-all hover:bg-neutral-50 hover:border-neutral-300 w-full sm:w-auto"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Kontaktovať Sašku
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <section className="section-wrapper container-custom !pt-8 pb-24">
        <div className="bg-white card-glass border-2 border-neutral-300 rounded-[2rem] shadow-md p-8 sm:p-12 relative overflow-hidden">
          {/* Flak dekorácie */}
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 200, top: -40, left: '20%', opacity: 0.38, transform: 'rotate(-30deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 180, top: -30, right: -30, opacity: 0.36, transform: 'rotate(20deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 190, top: '30%', left: -22, opacity: 0.34, transform: 'rotate(-15deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 170, top: '55%', right: -25, opacity: 0.35, transform: 'rotate(35deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 190, bottom: -35, right: '25%', opacity: 0.37, transform: 'rotate(45deg)' }} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 text-balance">
                Objavte svet Nitráčika!
              </h2>
              <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                Nitráčik nie je len pre deti – ponúka zážitky pre celú rodinu.
                Aj vy si u nás nájdete priestor na zábavu, oddych a rozvoj vlastnej
                kreativity. Objavte hravé aktivity, pri ktorých si prídu na svoje
                deti aj dospelí.
              </p>

              <div className="relative inline-flex items-center flex-wrap gap-4">
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={handleJoinClick}
                      className="inline-flex items-center justify-center rounded-full bg-neutral-100 px-6 py-3 text-sm font-bold text-neutral-600"
                    >
                      <Info className="w-5 h-5 mr-2" /> Ste už prihlásený
                    </button>
                    <AnimatePresence>
                      {showTooltip && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-0 mb-3 px-4 py-2 bg-foreground text-white text-sm font-medium rounded-lg whitespace-nowrap shadow-xl"
                        >
                          Už ste súčasťou našej komunity!
                          <div className="absolute top-full left-8 transform -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-600 hover:-translate-y-0.5">
                    Registrujem sa <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                )}
              </div>

              {isLoggedIn && (
                <div className="mt-10 pt-6 border-t border-neutral-100">
                  <p className="text-xs text-neutral-400 mb-4 font-extrabold uppercase tracking-wider">Rýchla navigácia</p>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/profile" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-600">
                      Môj profil
                    </Link>
                    <Link to="/aktivity" className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
                      Aktivity
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="rounded-[1.5rem] shadow-sm border border-neutral-100 overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[400px]">
                <img
                  src="/images/IMG_9024.jpg"
                  alt="Children enjoying messy sensory play at Nitracik"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  style={{ transform: 'translateZ(0)' }}
                  onError={(e) => {
                    e.target.src = 'https://picsum.photos/600/500?random=join';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MODALS --- */}
      
      {/* Edit About Us Modal */}
      <Modal show={showAboutEditModal} onHide={() => setShowAboutEditModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-neutral-100">
          <Modal.Title className="font-extrabold text-xl">Editovať sekciu</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6">
          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="font-bold text-sm text-neutral-700">Nadpis</Form.Label>
              <Form.Control
                type="text"
                className="rounded-xl border-neutral-200 focus:ring-primary focus:border-primary p-3 bg-neutral-50"
                value={editAboutForm.title}
                onChange={(e) => setEditAboutForm({ ...editAboutForm, title: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="font-bold text-sm text-neutral-700">Prvý odsek</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                className="rounded-xl border-neutral-200 focus:ring-primary focus:border-primary p-3 bg-neutral-50"
                value={editAboutForm.description}
                onChange={(e) => setEditAboutForm({ ...editAboutForm, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="font-bold text-sm text-neutral-700">Druhý odsek</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                className="rounded-xl border-neutral-200 focus:ring-primary focus:border-primary p-3 bg-neutral-50"
                value={editAboutForm.description2}
                onChange={(e) => setEditAboutForm({ ...editAboutForm, description2: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-neutral-100">
          <Button variant="light" className="rounded-full px-5 font-bold border border-neutral-200" onClick={() => setShowAboutEditModal(false)}>
            Zrušiť
          </Button>
          <Button variant="primary" className="rounded-full px-5 font-bold bg-primary border-primary hover:bg-primary-600 text-white" onClick={handleSaveAboutContent}>
            Uložiť zmeny
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Google Ratings Config Modal */}
      <Modal show={showGoogleRatingsModal} onHide={() => setShowGoogleRatingsModal(false)} centered>
        <Modal.Header closeButton className="border-neutral-100">
          <Modal.Title className="font-extrabold text-xl">{t?.about?.configureGoogleReviews || 'Konfigurovať Google Recenzie'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-6">
          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="font-bold text-sm text-neutral-700">Google Business ID</Form.Label>
              <Form.Control
                type="text"
                className="rounded-xl border-neutral-200 focus:ring-primary focus:border-primary p-3 bg-neutral-50"
                value={googleRatingsConfig.businessId}
                onChange={(e) => setGoogleRatingsConfig({ ...googleRatingsConfig, businessId: e.target.value })}
                placeholder="Napr. ChIJN1t_tDeuEmsRUsoyG83frY4"
              />
              <Form.Text className="text-neutral-500 mt-2 block text-sm font-medium">
                Tento identifikátor nájdete v nastaveniach vášho Google Business profilu.
              </Form.Text>
            </Form.Group>
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 mt-4">
              <Form.Check
                type="switch"
                id="google-reviews-switch"
                label={<span className="font-bold ml-2 text-foreground">Zobraziť Google recenzie na stránke</span>}
                checked={googleRatingsConfig.enabled}
                onChange={(e) => setGoogleRatingsConfig({ ...googleRatingsConfig, enabled: e.target.checked })}
              />
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="border-neutral-100">
          <Button variant="light" className="rounded-full px-5 font-bold border border-neutral-200" onClick={() => setShowGoogleRatingsModal(false)}>
            {t?.common?.cancel || 'Zrušiť'}
          </Button>
          <Button variant="primary" className="rounded-full px-5 font-bold bg-primary border-primary hover:bg-primary-600 text-white" onClick={handleGoogleRatingsSave}>
            {t?.common?.save || 'Uložiť'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedReview(null)}
          >
            {/* Backdrop - bez backdrop-blur pre iOS výkon */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl border border-neutral-200 p-5 sm:p-8"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedReview(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 hover:text-neutral-700 transition-all"
                aria-label="Zavrieť"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Author info */}
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                <img
                  src={selectedReview.profile_photo_url || getAvatarDataUri(selectedReview.author_name)}
                  alt=""
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-neutral-100"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getAvatarDataUri(selectedReview.author_name);
                  }}
                />
                <div>
                  <h3 className="font-extrabold text-foreground text-base sm:text-lg">{selectedReview.author_name}</h3>
                  {selectedReview.relative_time_description && (
                    <span className="text-neutral-500 text-xs sm:text-sm block mt-0.5 font-medium">
                      {selectedReview.relative_time_description}
                    </span>
                  )}
                </div>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4 sm:mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[1.5px] ${i < selectedReview.rating ? 'fill-yellow-400 text-neutral-700' : 'fill-transparent text-neutral-300'}`} />
                ))}
              </div>

              {/* Full review text */}
              <div className="text-neutral-600 text-sm sm:text-base leading-relaxed text-justify">
                <p>"{selectedReview.text}"</p>
              </div>

              {/* Google icon footer */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-neutral-100 flex items-center gap-2 text-xs text-neutral-400 font-medium">
                <img src={googleIcon} alt="Google" className="w-3.5 h-3.5" />
                Overená recenzia z Google
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AboutUs;