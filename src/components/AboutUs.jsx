// Updated AboutUs.jsx - REFINED LAYOUT & SOFTER CARDS
import React, { useState, useEffect, useCallback } from 'react';
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
      image: '/images/close-up-kids-painting-with-brushes-together.jpg',
      title: carouselText[0]?.title || 'Profesionálne tréningy',
      description: carouselText[0]?.description || 'Tréningy vedené odborníkmi pre všetky úrovne',
    },
    {
      id: 2,
      image: '/images/elevated-view-two-boys-gathering-confetti-wooden-floor.jpg',
      title: carouselText[1]?.title || 'Moderné priestory',
      description: carouselText[1]?.description || 'Špičkové vybavenie a príjemné prostredie',
    },
    {
      id: 3,
      image: '/images/close-up-kids-painting-with-brushes.jpg',
      title: carouselText[2]?.title || 'Certifikovaní inštruktori',
      description: carouselText[2]?.description || 'Skúsení profesionáli s dlhoročnou praxou',
    },
    {
      id: 4,
      image: '/images/little-boy-playing.jpg',
      title: carouselText[3]?.title || 'Komunita a podpora',
      description: carouselText[3]?.description || 'Staňte sa súčasťou našej rastúcej komunity',
    },
    {
      id: 5,
      image: '/images/small-baby-play-with-ribbed-rug.jpg',
      title: carouselText[4]?.title || 'Flexibilné termíny',
      description: carouselText[4]?.description || 'Hodiny v časoch, ktoré vám vyhovujú',
    },
  ];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

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
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
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

  const goToSlide = (index) => setCurrentSlide(index);

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
    <motion.div 
      initial="hidden"
      animate="visible"
      className="relative w-full overflow-hidden"
    >
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
      <motion.section 
        variants={fadeInUp}
        className="container-custom py-8"
      >
        <div className="relative w-full max-w-6xl mx-auto h-[450px] overflow-hidden rounded-[2rem] shadow-sm group border border-neutral-200">
          <div
            className="flex transition-transform duration-700 ease-out h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {carouselItems.map((item, idx) => (
              <div key={item.id} className="relative w-full h-full flex-shrink-0 bg-white">
                <img
                  src={item.image}
                  alt={item.title}
                  className="object-cover w-full h-full transform transition-transform hover:scale-105"
                  style={{ transitionDuration: '10s' }}
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
            className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white opacity-0 transition-all duration-300 hover:bg-white hover:text-foreground group-hover:opacity-100"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white opacity-0 transition-all duration-300 hover:bg-white hover:text-foreground group-hover:opacity-100"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </motion.section>

      {/* About Us Text Section - SOFTER CARD & NEW LAYOUT */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="section-wrapper container-custom"
      >
        <div className="relative">
          <img
            src={mascotImage}
            alt=""
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 sm:w-24 z-20 pointer-events-none"
            style={{ filter: 'drop-shadow(2px 4px 12px rgba(0,0,0,0.12))' }}
          />
          <div className="card-glass border border-neutral-200 rounded-[2rem] shadow-sm p-8 sm:p-12 relative">
          
          {/* Centered Heading at the top */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-center mb-10 text-foreground">
              {aboutContent.title}
            </h2>
          </motion.div>

          {/* Text and Image side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Image Block */}
            <motion.div variants={fadeInUp} className="order-2 lg:order-1 relative rounded-[1.5rem] overflow-hidden min-h-[300px] lg:min-h-full shadow-sm border border-neutral-100">
              <img
                src="/images/nitracik_about_us.jpg"
                alt="Children enjoying activities at Nitracik"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://picsum.photos/600/400?random=about';
                }}
              />
            </motion.div>

            {/* Text Block */}
            <motion.div variants={fadeInUp} className="order-1 lg:order-2 flex flex-col justify-center">
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
            </motion.div>
          </div>
          </div>
        </div>
      </motion.section>

      {/* Google Ratings Section - REFINED SPACING & STARS */}



      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="section-wrapper container-custom"
      >
        <div className="relative">
          <img
            src={mascotImage}
            alt=""
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 sm:w-24 z-20 pointer-events-none"
            style={{ filter: 'drop-shadow(2px 4px 12px rgba(0,0,0,0.12))' }}
          />
          <div className="card-glass border border-neutral-200 rounded-[2rem] shadow-sm p-8 sm:p-12">
          <motion.div variants={fadeInUp} className="text-center mb-6">
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

            <p className="flex items-center justify-center gap-2 text-sm text-neutral-500 font-medium">
              <img src={googleIcon} alt="Google" className="w-4 h-4" />
              Overené recenzie z Google
            </p>
          </motion.div>

          <motion.div variants={fadeInUp} className="relative px-0 sm:px-8 mt-2">
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
                    className="flex items-start transition-transform duration-500 ease-in-out"
                    style={{
                      gap: `${reviewGapRem}rem`,
                      transform: `translateX(calc(-${reviewCarouselIndex} * ((100% - ${(reviewCardsPerView - 1) * reviewGapRem}rem) / ${reviewCardsPerView} + ${reviewGapRem}rem)))`,
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
          </motion.div>

          {isAdmin && (
            <motion.div variants={fadeInUp} className="mt-8 pt-6 border-t border-neutral-100 flex justify-center">
              <button
                onClick={() => setShowGoogleRatingsModal(true)}
                className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                {t?.about?.configureGoogleReviews || 'Konfigurovať Google recenzie'}
              </button>
            </motion.div>
          )}
          </div>
        </div>
      </motion.section>

      {/* Gift Card Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="section-wrapper container-custom"
      >
        <div className="card-glass border border-neutral-200 rounded-[2rem] shadow-sm p-8 sm:p-12 relative overflow-hidden">
          {/* Subtle decorative background */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-100/40 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-100/30 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
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
              <p className="text-neutral-500 text-sm sm:text-base leading-relaxed mb-8">
                Či už je to narodeninový darček, odmena za vysvedčenie alebo prekvapenie 
                bez dôvodu – poukaz poteší každé dieťa. Jednoduchý nákup online, 
                doručenie emailom a platnosť až 12 mesiacov.
              </p>
              <Link
                to="/gift-card"
                className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-full px-8 py-3.5 shadow-sm transition-all hover:-translate-y-0.5"
              >
                <Gift className="w-5 h-5" />
                Kúpiť darčekový poukaz
              </Link>
            </div>
            <div className="flex-shrink-0 w-full sm:w-[340px]">
              <GiftCertificate
                mode="preview"
                amount={50}
                recipientName="Maťko"
                buyerEmail="mama@nitracik.sk"
                message="Užite si krásny zážitok! 🎉"
                expiresAt={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
                code={null}
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Blog Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="section-wrapper container-custom"
      >
        <div className="card-glass border border-neutral-200 rounded-[2rem] shadow-sm p-8 sm:p-12">
          <Blog limit={3} showViewAll={true} />
        </div>
      </motion.section>

      {/* Owner Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="section-wrapper container-custom"
      >
        <div className="bg-white border border-neutral-200 rounded-[2rem] shadow-sm p-0 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
            <motion.div variants={fadeInUp} className="h-[400px] lg:h-auto relative">
              <picture>
                <source media="(min-width: 1024px)" srcSet={ownerImageDesktop} />
                <img
                  src={ownerImageMobile}
                  alt="Saška - Majiteľka Nitráčika"
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  onError={(e) => {
                    e.target.src = 'https://picsum.photos/500/600?random=owner';
                  }}
                />
              </picture>
            </motion.div>

            <motion.div variants={fadeInUp} className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
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
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Join Us Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeInUp}
        className="section-wrapper container-custom pb-24"
      >
        <div className="card-glass border border-neutral-200 rounded-[2rem] shadow-sm p-8 sm:p-12 relative">
          {/* Subtle background decoration instead of strong gradients to match the softer cards */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 text-balance">
                Objavte svet Messy & Sensory Play!
              </h2>
              <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                Doprajte deťom radosť z tvorenia, farieb a zmyslového objavovania.
                Čakajú ich hravé aktivity, ktoré podporujú kreativitu, jemnú motoriku
                aj prirodzenú zvedavosť.
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
                    {showTooltip && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-full left-0 mb-3 px-4 py-2 bg-foreground text-white text-sm font-medium rounded-lg whitespace-nowrap shadow-xl"
                      >
                        Už ste súčasťou našej komunity!
                        <div className="absolute top-full left-8 transform -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-600 hover:-translate-y-0.5">
                    Registrujem sa <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                )}
              </div>

              {isLoggedIn && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-10 pt-6 border-t border-neutral-100"
                >
                  <p className="text-xs text-neutral-400 mb-4 font-extrabold uppercase tracking-wider">Rýchla navigácia</p>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/profile" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-600">
                      Môj profil
                    </Link>
                    <Link to="/aktivity" className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
                      Aktivity
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="relative">
              <div className="rounded-[1.5rem] shadow-sm border border-neutral-100 overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[400px]">
                <img
                  src="/images/nitracik_join_us.jpg"
                  alt="Children enjoying messy sensory play at Nitracik"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://picsum.photos/600/500?random=join';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

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
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

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
    </motion.div>
  );
};

export default AboutUs;