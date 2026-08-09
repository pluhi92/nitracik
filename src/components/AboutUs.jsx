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

const FlakPink = ({ className, style }) => (
  <svg viewBox="0 0 170.079 170.658" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path
      transform="matrix(1,0,0,-1,102.0004,33.3618)"
      fill="#F4A5A5"
      d="M0 0C-.049 .001-.084 .006-.122 .01-.182 .023-.241 .037-.301 .049-.28 .054-.187 .045 0 0M19.592-55.855C20.281-56.109 20.126-56.34 19.592-55.855M59.411-29.461C57.428-26.123 53.616-24.284 50.208-22.771 45.813-20.82 41.283-19.202 36.756-17.587 34.934-16.937 33.322-16.418 31.946-15.898 33.149-13.263 34.563-10.35 35.803-7.743 38.635-1.79 44.262 6.585 43.568 13.498L43.497 13.469C43.477 15.353 42.864 17.163 41.371 18.802 37.474 23.079 28.987 20.373 28.555 14.604 28.445 14.402 28.336 14.198 28.223 14.009 27.353 12.55 26.389 11.142 25.433 9.738 23.773 7.298 22.062 4.894 20.341 2.496 17.561 3.718 13.969 3.659 11.099 3.032 9.233 2.625 7.411 2.02 5.587 1.448 4.969 4.959 2.515 8.404-1.587 7.855-4.99 7.4-8.385 6.912-11.775 6.385-12.271 11.193-13.235 15.956-14.62 20.562-16.34 26.288-22.863 27.479-27.155 23.872-29.653 21.772-31.991 19.435-34.568 17.453-34.618 17.567-34.663 17.681-34.714 17.794-38.307 25.869-50.188 19.92-48.422 12.015-47.755 9.033-46.907 6.076-45.887 3.176-46.502 3.008-47.126 2.762-47.758 2.406-57.967-3.36-68.755-7.401-80.21-9.896-84.776-10.891-86.216-14.818-85.362-18.369-86.023-18.416-86.685-18.451-87.347-18.501-96.907-19.233-97.085-33.067-87.347-33.501-81.613-33.757-75.879-34.013-70.144-34.269-70.426-35.257-70.513-36.288-70.372-37.299-71.676-36.835-73.11-36.745-74.61-37.174-77.526-38.008-80.49-41.163-80.116-44.406-79.648-48.474-77.55-52.006-74.602-54.375-73.368-56.077-72.13-57.775-70.894-59.475-73.925-59.862-76.894-62.027-77.429-64.966-77.515-65.437-77.579-65.903-77.632-66.367-77.665-66.302-77.709-66.233-77.74-66.169-77.842-65.96-78.057-65.256-78.171-64.792-78.171-64.779-78.171-64.766-78.17-64.753-78.013-65.121-77.933-63.415-78.146-64.399-76.112-55.002-90.455-50.97-92.61-60.411-94.585-69.06-90.861-78.252-87.146-85.912-83.522-93.383-78.368-102.026-71.043-106.413-70.899-106.499-70.752-106.575-70.607-106.655-71.385-107.292-72.087-107.977-72.681-108.716-75.51-112.236-75.857-118.087-71.163-120.496-66.359-122.962-59.616-121.749-53.963-118.957-52.734-120.363-51.239-121.576-49.448-122.532-45.554-124.61-40.944-124.631-36.98-122.994-32.924-124.98-28.867-126.966-24.81-128.953-21.445-130.6-16.346-130.152-14.549-126.262-12.801-122.479-12.278-118.361-12.835-114.457-12.433-114.495-12.031-114.533-11.629-114.57-7.965-114.914-4.666-111.455-4.263-108.067-4.142-107.049-4.209-106.096-4.432-105.218-3.22-104.77-2.05-104.177-.94-103.467 1.423-105.279 3.805-107.066 6.221-108.806 12.385-113.244 19.072-118.602 26.383-121.019 31.118-122.584 36.677-121.152 38.264-115.886 39.425-112.034 37.477-108.294 35.327-105.21 31.237-99.345 26.243-94.192 21.555-88.821 21.454-88.705 21.354-88.587 21.253-88.471 25.425-87.677 28.671-85.208 31.348-81.712 33.784-78.532 31.874-73.606 28.881-71.604 29.147-71.392 29.404-71.181 29.645-70.975 34.107-67.15 37.25-61.703 36.609-55.69 35.893-48.969 30.618-45.112 25.644-41.229 34.669-43.988 45.652-46.496 54.535-42.159 59.491-39.739 62.499-34.66 59.411-29.461"
    />
  </svg>
);

const FlakCream = ({ className, style }) => (
  <svg viewBox="0 0 170.079 186.77" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-hidden="true">
    <path
      transform="matrix(1,0,0,-1,48.2144,165.57071)"
      fill="#EFE4C8"
      d="M0 0C-.168-.194-.238-.269 0 0M-26.05 53.518C-26.131 53.517-26.214 53.524-26.295 53.521-26.528 53.513-26.826 53.628-27.052 53.58-26.742 53.646-26.402 53.614-26.05 53.518M-21.47 47.527C-21.498 47.541-21.521 47.552-21.534 47.559-21.638 47.617-21.705 47.635-21.758 47.641-21.758 47.645-21.757 47.646-21.757 47.65-21.734 48.081-21.613 47.898-21.47 47.527M110.15 62.303C107.116 63.184 104.727 64.781 102.823 66.842 103.529 68.373 103.864 69.987 103.89 71.627 107.735 73.614 110.494 77.248 110.025 82.154 109.638 86.21 106.903 89.629 102.525 89.654 100.286 89.667 98.047 89.68 95.808 89.693 95.791 89.776 95.772 89.859 95.755 89.942 96.096 90.51 96.433 91.081 96.746 91.661 102.128 101.644 101.602 115.764 91.484 122.235 87.426 127.948 80.504 130.605 73.631 130.344 71.238 131.943 68.231 132.319 65.794 131.33 65.44 132.156 65.044 132.975 64.57 133.777 62.624 137.073 59.423 137.949 56.571 137.17 53.53 142.418 50.094 147.541 46.219 152.177 44.129 154.678 41.587 157.301 38.336 158.187 33.582 159.483 29.055 156.611 27.626 152.049 25.506 145.277 27.868 136.599 29.08 129.88 29.306 128.625 29.59 127.328 29.898 126.01 29.882 125.982 29.865 125.955 29.849 125.928 28.135 124.055 26.418 122.185 24.71 120.308 23.918 119.437 22.939 118.469 21.906 117.431 21.381 117.615 20.844 117.777 20.293 117.908 16.407 124.779 12.204 132.099 11.117 139.561 10.307 145.122 2.057 146.775-1.419 142.871-7.775 135.73-6.737 125.805-4.314 117.219-4.223 116.895-4.111 116.574-4.015 116.251-7.819 115.72-11.541 114.236-14.5 111.961-21.762 114.214-29.373 114.816-36.422 113.282-43.959 111.641-43.148 100.885-36.422 98.818-29.578 96.714-23.759 92.901-18.416 88.34-20.759 88.357-23.047 87.64-24.772 85.878-28.055 82.525-27.219 78.105-25.606 74.209-22.098 65.735-14.95 59.381-7.67 54.053-10.925 53.889-14.181 53.732-17.439 53.612-19.622 53.532-21.81 53.451-23.995 53.466-24.472 53.469-24.953 53.493-25.433 53.509-29.306 54.641-34.412 52.786-35.444 48.477-37.939 38.061-28.156 33.128-19.643 31.287-12.564 29.757-5.314 29.111 1.923 28.51 .46 22.217-.966 15.912-2.183 9.568-3.345 3.505-4.649-2.693-3.781-8.86-3.037-14.148 3.398-15.053 7.236-13.342 12.229-11.117 15.582-4.028 18.151 .638 18.69-.342 19.373-1.294 20.226-2.201 25.939-8.272 35.783-8.166 42.419-3.696 46.618-.867 48.926 3.22 50.119 7.756 57.704 3.858 66.779 2.626 74.906 4.709 80.686 6.19 88.654 10.306 92.058 15.338 97.075 22.757 91.471 28.464 84.373 30.439 84.335 30.449 84.258 30.473 84.159 30.504 85.116 32.223 85.851 34.067 86.308 35.971 87.099 39.259 87.17 43.268 86.072 46.52 86.044 46.603 86.006 46.683 85.976 46.765 86.932 46.624 87.894 46.427 88.868 46.138 91.649 45.314 94.118 46.242 95.839 47.967 97.975 47.722 99.924 48.397 101.384 49.651 102.872 48.948 104.456 48.334 106.162 47.839 115.451 45.143 119.417 59.614 110.15 62.303"
    />
  </svg>
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
      <section className="container-custom py-8">
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
      </section>

      {/* About Us Text Section - SOFTER CARD & NEW LAYOUT */}
      <section className="section-wrapper container-custom">
        <div className="relative">
          <img
            src={mascotImage}
            alt=""
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 sm:w-24 z-20 pointer-events-none"
            style={{ filter: 'drop-shadow(2px 4px 12px rgba(0,0,0,0.12))' }}
          />
          <div className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md p-8 sm:p-12 relative overflow-hidden">
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
                src="/images/nitracik_about_us.jpg"
                alt="Children enjoying activities at Nitracik"
                className="absolute inset-0 w-full h-full object-cover"
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



      <section className="section-wrapper container-custom">
        <div className="relative">
          <img
            src={mascotImage}
            alt=""
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 sm:w-24 z-20 pointer-events-none"
            style={{ filter: 'drop-shadow(2px 4px 12px rgba(0,0,0,0.12))' }}
          />
          <div className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md p-8 sm:p-12 relative overflow-hidden">
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
      <section className="section-wrapper container-custom">
        <div className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md p-6 sm:p-8 relative overflow-hidden">
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
                  Či už je to narodeninový darček, odmena za vysvedčenie alebo prekvapenie 
                  bez dôvodu – poukaz poteší každé dieťa. Jednoduchý nákup online, 
                  doručenie emailom a platnosť až 12 mesiacov.
                </p>
              </div>
              <div className="hidden sm:block flex-shrink-0 w-full max-w-[820px] mx-auto lg:mx-0 lg:flex-[0_0_700px]">
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
      <section className="section-wrapper container-custom">
        <div className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md p-8 sm:p-12 relative overflow-hidden">
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
      <section className="section-wrapper container-custom">
        <div className="bg-white border-2 border-neutral-500 rounded-[2rem] shadow-md p-0 overflow-hidden relative">
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
                  className="absolute inset-0 w-full h-full object-cover object-top"
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
      <section className="section-wrapper container-custom pb-24">
        <div className="bg-white card-glass border-2 border-neutral-500 rounded-[2rem] shadow-md p-8 sm:p-12 relative overflow-hidden">
          {/* Flak dekorácie */}
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 200, top: -40, left: '20%', opacity: 0.38, transform: 'rotate(-30deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 180, top: -30, right: -30, opacity: 0.36, transform: 'rotate(20deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 190, top: '30%', left: -22, opacity: 0.34, transform: 'rotate(-15deg)' }} />
          <FlakPink className="absolute pointer-events-none z-0" style={{ width: 170, top: '55%', right: -25, opacity: 0.35, transform: 'rotate(35deg)' }} />
          <FlakCream className="absolute pointer-events-none z-0" style={{ width: 190, bottom: -35, right: '25%', opacity: 0.37, transform: 'rotate(45deg)' }} />

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
    </div>
  );
};

export default AboutUs;