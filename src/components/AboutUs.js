// Updated AboutUs.js - FIXED ADMIN LOGIC
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';
import { Button, Modal, Form, Alert } from 'react-bootstrap';
import api from '../api/api';
import Blog from './Blog'; // Import the Blog component
import ownerImage from '../assets/owner.jpg';

const carouselItems = [
  {
    id: 1,
    image: '/images/close-up-kids-painting-with-brushes-together.jpg',
    title: 'Professional Training',
    description: 'Expert-led sessions for all skill levels',
  },
  {
    id: 2,
    image: '/images/elevated-view-two-boys-gathering-confetti-wooden-floor.jpg',
    title: 'Modern Facilities',
    description: 'State-of-the-art equipment and environment',
  },
  {
    id: 3,
    image: '/images/close-up-kids-painting-with-brushes.jpg',
    title: 'Certified Instructors',
    description: 'Qualified professionals with years of experience',
  },
  {
    id: 4,
    image: '/images/little-boy-playing.jpg',
    title: 'Community Focus',
    description: 'Join our growing community of learners',
  },
  {
    id: 5,
    image: '/images/small-baby-play-with-ribbed-rug.jpg',
    title: 'Flexible Scheduling',
    description: 'Sessions available at convenient times',
  },
];

const AboutUs = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // User Context
  const { user } = useUser();
  const isLoggedIn = user.isLoggedIn;

  // ✅ OPRAVENÁ ADMIN LOGIKA - podľa vzoru z FAQ.js
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


  // --- STAVY PRE EDITOVANIE SEKCII ---
  const [aboutContent, setAboutContent] = useState({
    title: 'O nás',
    description: 'Vitajte v Nitráčiku! Sme lokalný projekt zameraný na kreatívny rozvoj detí. Naša misia je vytvárať priestor, kde sa deti môžu slobodne vyjadrovať, objavovať a učiť sa prostredníctvom hry a kreativity.',
    description2: 'Ponúkame rôzne programy a workshopy navrhnuté tak, aby podporovali motorické zručnosti, sociálnu interakciu a tvorivé myslenie u detí všetkých vekových kategórií.',
  });


  const [showAboutEditModal, setShowAboutEditModal] = useState(false);
  const [editAboutForm, setEditAboutForm] = useState({ ...aboutContent });
  const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });

  // ✅ ADMIN CHECK FUNKCIA - podľa vzoru z FAQ.js
  const checkAdminStatus = useCallback(async () => {
    if (!userId || !user.isLoggedIn) {
      return;
    }

    try {
      const response = await api.get(`/api/users/${userId}`);
      // Kontrola podľa role (fallback na localStorage pre staršie sesie)
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

 // V AboutUs.js nahraďte tieto dva useEffect hooks:

// ✅ SPOJENÝ EFFECT PRE VŠETKY DATA - s user v závislostiach
useEffect(() => {
  const loadData = async () => {
    try {
      // 1. Skontrolujeme admin status LEN ak je užívateľ prihlásený
      if (userId && user.isLoggedIn) {
        await checkAdminStatus();
      } else {
        setIsAdmin(false); // DÔLEŽITÉ: Resetovať admin status pri odhlásení
      }

      // 2. Načítame verejné recenzie (vždy)
      try {
        const reviewsRes = await api.get('/api/reviews');
        setReviews(reviewsRes.data.reviews || []);
        setGoogleRating(
          typeof reviewsRes.data.rating === 'number' ? reviewsRes.data.rating : null
        );
        setGoogleTotalRatings(
          typeof reviewsRes.data.totalRatings === 'number' ? reviewsRes.data.totalRatings : null
        );
        setGoogleRatingsConfig((prev) => ({
          ...prev,
          enabled: !!reviewsRes.data.enabled,
          businessId: reviewsRes.data.businessId || prev.businessId
        }));
      } catch (err) {
        console.error("Nepodarilo sa načítať recenzie:", err);
      }

      // 3. Načítame obsah sekcií z databázy (vždy)
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
}, [userId, user.isLoggedIn, checkAdminStatus]); // ← Pridané user.isLoggedIn

  useEffect(() => {
    const updateCardsPerView = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setReviewCardsPerView(1);
      } else if (width < 1024) {
        setReviewCardsPerView(2);
      } else {
        setReviewCardsPerView(3);
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

// ✅ SAMOSTATNÝ EFFECT PRE NAČÍTANIE ADMIN DÁT - updatovaný
useEffect(() => {
  const loadAdminConfig = async () => {
    if (isAdmin && user.isLoggedIn) { // ← Pridaná kontrola prihlásenia
      try {
        const configRes = await api.get('/api/admin/google-ratings');
        setGoogleRatingsConfig(configRes.data);
      } catch (err) {
        console.error("Nepodarilo sa načítať admin config:", err);
      }
    } else {
      // Resetovať admin config ak nie sme admin alebo sme odhlásený
      setGoogleRatingsConfig({
        businessId: '',
        enabled: false
      });
    }
  };

  loadAdminConfig();
}, [isAdmin, user.isLoggedIn]); // ← Pridané user.isLoggedIn

  // --- FUNKCIE PRE EDITOVANIE ---
  const handleSaveAboutContent = async () => {
    try {
      await api.post('/api/admin/about-content', editAboutForm);
      setAboutContent(editAboutForm);
      setShowAboutEditModal(false);
      setAlertMessage({ type: 'success', text: 'Obsah sekcie "O nás" bol úspešne uložený.' });
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
      setAlertMessage({ type: 'success', text: 'Google ratings configuration saved' });
      setTimeout(() => setAlertMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving Google ratings config:', error);
      setAlertMessage({ type: 'error', text: 'Failed to save configuration' });
    }
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  }, []);

  const prevSlide = () =>
    setCurrentSlide(
      (prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1)
    );

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
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [currentSlide, nextSlide]);

  // Efekt pre reset formulárov pri otvorení modalu
  useEffect(() => {
    if (showAboutEditModal) {
      setEditAboutForm({ ...aboutContent });
    }
  }, [showAboutEditModal, aboutContent]);


  const reviewGapRem = reviewCardsPerView === 1 ? 0 : reviewCardsPerView === 2 ? 1.5 : 2;

  return (
    <section className="px-6 py-12 text-center bg-inherit rounded-xl shadow-xl transition-colors duration-300 text-secondary">
      {/* Alert message */}
      {alertMessage.text && (
        <div className="max-w-6xl mx-auto mb-6">
          <Alert variant={alertMessage.type === 'success' ? 'success' : 'danger'}>
            {alertMessage.text}
          </Alert>
        </div>
      )}

      {/* Carousel */}
      <div className="relative w-full max-w-6xl mx-auto mb-16 overflow-hidden rounded-xl shadow-2xl">
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${currentSlide * 100}%)`, height: '400px' }}
        >
          {carouselItems.map((item) => (
            <div key={item.id} className="relative w-full h-full flex-shrink-0">
              <img
                src={item.image}
                alt={item.title}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.target.src = `https://picsum.photos/1200/400?random=${item.id}`;
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 text-left text-white">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="opacity-90">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-transform hover:scale-110"
        >
          ‹
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-transform hover:scale-110"
        >
          ›
        </button>

        {/* Indicators */}
        <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-3">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white/50 hover:bg-white/70'
                }`}
            ></button>
          ))}
        </div>
      </div>

      {/* About Us Text Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 mb-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-secondary">
              {aboutContent.title}
            </h2>
            <div className="prose prose-lg text-gray-700 dark:text-gray-300">
              <p>
                {aboutContent.description}
              </p>
              <p>
                {aboutContent.description2}
              </p>
            </div>
          </div>
          <div className="rounded-lg shadow-xl overflow-hidden">
            <img
              src="/images/nitracik_about.jpg"
              alt="Children enjoying activities at Nitracik"
              className="w-full h-[400px] object-cover"
              onError={(e) => {
                e.target.src = 'https://picsum.photos/600/400?random=about';
              }}
            />
          </div>
        </div>

        {/* ✅ Admin Edit Button - FIXED */}
        {isAdmin && (
          <div className="mt-6 text-right">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setShowAboutEditModal(true)}
            >
              ✏️ Editovať text
            </Button>
          </div>
        )}
      </section>

      {/* Blog Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 mb-16 bg-white rounded-xl shadow-lg">
        <Blog limit={3} showViewAll={true} />
      </section>

      {/* Google Ratings Section */}
      <section className="max-w-6xl mx-auto px-6 py-12 mb-16 bg-white rounded-xl shadow-lg relative">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-secondary mb-4">
            Napísali ste o nás
          </h2>
          <div className="flex justify-center items-center gap-2 mb-2">
            <span className="text-gray-800 text-sm font-semibold">
              {typeof googleRating === 'number' ? googleRating.toFixed(1).replace('.', ',') : '5,0'}
            </span>
            <span className="text-yellow-400 text-xl">
              {typeof googleRating === 'number'
                ? '★'.repeat(Math.round(googleRating)) + '☆'.repeat(5 - Math.round(googleRating))
                : '★★★★★'}
            </span>
            <span className="text-gray-600 text-sm">
              {typeof googleTotalRatings === 'number' ? googleTotalRatings : ''}{' '}
              <a
                href="https://www.google.com/search?client=firefox-b-d&hs=m3Gp&sca_esv=16c10c6f9a01096f&sxsrf=ANbL-n5U7G3pcziy0OKDhVF3ZpucVG3tVg:1769983804289&q=oz+nitracik&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qORyeFUD8RLlkp1uDMb4_qrz-O-sgmYi0srdiwkjPIwpx0NHh2SWSMQLd9J5Etu_dGxNKLiQ%3D&uds=ALYpb_nDBGPPBSbt_mWAKMakwCMVR6SjXdjOTiVZzrlNPmTabxiI0LnjYcL_Scxb8z1ahXM6oMwKt6POPbGWk76FJyPXXIpE018irVhPA2vdz3VI2ZsWtVA&sa=X&ved=2ahUKEwjUtaa_p7mSAxXRA9sEHWwqJcYQ3PALegQIGxAE&biw=2509&bih=1307&dpr=1&aic=0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline font-medium"
              >
                recenzií
              </a>
            </span>
          </div>
          <p className="text-gray-600 mb-6">
            Overené recenzie z Google
          </p>
        </div>

        {/* Dynamický výpis recenzií – carousel */}
        <div className="p-4">
          {reviews.length > 0 ? (
            <div className="relative">
              {/* Left arrow – visible only when not at the start */}
              {reviewCarouselIndex > 0 && (
                <button
                  onClick={() => setReviewCarouselIndex((prev) => Math.max(0, prev - 1))}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center shadow-md transition-all hover:scale-110"
                  style={{ fontSize: '1.4rem', lineHeight: 1 }}
                >
                  ‹
                </button>
              )}

              {/* Clipping viewport */}
              <div className="overflow-hidden px-0 sm:px-4">
                {/* Sliding row – each card is exactly 1/3 of the row (same as Blog col-lg-4) */}
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{
                    gap: `${reviewGapRem}rem`,
                    transform: `translateX(calc(-${reviewCarouselIndex} * ((100% - ${(reviewCardsPerView - 1) * reviewGapRem}rem) / ${reviewCardsPerView} + ${reviewGapRem}rem)))`,
                  }}
                >
                  {reviews.slice(0, 5).map((review, index) => (
                    <div
                      key={index}
                      className="border border-neutral-100 rounded-lg p-4 bg-neutral-50 shadow-sm flex-shrink-0"
                      style={{ width: `calc((100% - ${(reviewCardsPerView - 1) * reviewGapRem}rem) / ${reviewCardsPerView})` }}
                    >
                      <div className="flex items-center mb-4">
                        <img
                          src={review.profile_photo_url}
                          alt={review.author_name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <div>
                          <h4 className="font-semibold text-sm">{review.author_name}</h4>
                          <div className="text-yellow-400 text-xs">
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                          {review.relative_time_description && (
                            <div className="text-gray-400 text-xs mt-1">
                              {review.relative_time_description}
                            </div>
                          )}
                        </div>
                        <img
                          src="/google_icon.png"
                          alt="Google"
                          className="w-5 h-5 ml-auto"
                        />
                      </div>
                      <p className="text-gray-600 text-sm italic">
                        "{review.text.length > 150 ? review.text.substring(0, 150) + '...' : review.text}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right arrow – visible only when more cards remain */}
              {reviewCarouselIndex < reviews.slice(0, 5).length - reviewCardsPerView && (
                <button
                  onClick={() => setReviewCarouselIndex((prev) => Math.min(reviews.slice(0, 5).length - reviewCardsPerView, prev + 1))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white/90 hover:bg-white border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center shadow-md transition-all hover:scale-110"
                  style={{ fontSize: '1.4rem', lineHeight: 1 }}
                >
                  ›
                </button>
              )}
            </div>
          ) : (
            <div className="col-span-full text-center">
              {googleRatingsConfig.enabled ? (
                <div className="bg-white p-6 rounded-lg shadow inline-block">
                  <p className="text-gray-600 mb-4">Zatiaľ sa nepodarilo načítať recenzie, ale nájdete nás na Google.</p>
                  <a
                    href={`https://search.google.com/local/reviews?placeid=${googleRatingsConfig.businessId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Zobraziť na Google Maps
                  </a>
                </div>
              ) : (
                <p className="text-gray-400">Recenzie momentálne nie sú k dispozícii.</p>
              )}
            </div>
          )}
        </div>

        {/* ✅ Admin Configuration Button - FIXED */}
        {isAdmin && (
          <div className="mt-8 text-center border-t pt-6">
            <Button
              variant="outline-secondary"
              onClick={() => setShowGoogleRatingsModal(true)}
            >
              ⚙️ {t?.about?.configureGoogleReviews || 'Konfigurovať Google recenzie'}
            </Button>
          </div>
        )}
      </section>

      {/* Owner Section - Šírka nastavená presne podľa Google sekcie */}
      <section className="max-w-6xl mx-auto px-6 py-12 mb-16 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-secondary">
            {t?.about?.meetTheOwner || 'Stretnite sa s majiteľkou'}
          </h2>
        </div>

        {/* Tu sme odstránili bg-white shadow-lg p-8, aby sa to "nezdvojovalo" */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center p-0 lg:p-8">
          {/* Fotka */}
          <div className="rounded-lg overflow-hidden shadow-xl mx-0">
            <img
              src={ownerImage}
              alt="Saška - Majiteľka Nitráčika"
              className="w-full h-[580px] object-cover"
              onError={(e) => {
                e.target.src = 'https://picsum.photos/500/400?random=owner';
              }}
            />
          </div>

          {/* Text */}
          <div>
            <h3 className="text-2xl font-bold mb-4">
              Ahoj! Volám sa Saška
            </h3>
            <div className="prose prose-lg text-gray-700 mb-6">
              <p>
                Ahoj! Volám sa Saška a stojím za lokálnym projektom Nitráčik.
                Mojou vášňou je vytvárať priestor, kde sa deti môžu rozvíjať,
                učiť sa novým veciam a hlavne - baviť sa!
              </p>
              <p className="mt-4">
                Verím, že každé dieťa má v sebe neobmedzený potenciál, a mojou
                úlohou je pomôcť mu tento potenciál objaviť.
              </p>
            </div>

            <div className="mt-6">
              <Link
                to="/contact"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                Kontaktovať Sašku
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}

      {/* ✅ About Us Edit Modal */}
      <Modal show={showAboutEditModal} onHide={() => setShowAboutEditModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Editovať sekciu "O nás"</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-4">
              <Form.Label className="font-semibold">Nadpis</Form.Label>
              <Form.Control
                type="text"
                value={editAboutForm.title}
                onChange={(e) => setEditAboutForm({ ...editAboutForm, title: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="font-semibold">Prvý odsek</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={editAboutForm.description}
                onChange={(e) => setEditAboutForm({ ...editAboutForm, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="font-semibold">Druhý odsek</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={editAboutForm.description2}
                onChange={(e) => setEditAboutForm({ ...editAboutForm, description2: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAboutEditModal(false)}>
            Zrušiť
          </Button>
          <Button variant="primary" onClick={handleSaveAboutContent}>
            Uložiť
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Google Ratings Configuration Modal */}
      <Modal show={showGoogleRatingsModal} onHide={() => setShowGoogleRatingsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{t?.about?.configureGoogleReviews || 'Konfigurovať Google Recenzie'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Google Business ID</Form.Label>
              <Form.Control
                type="text"
                value={googleRatingsConfig.businessId}
                onChange={(e) => setGoogleRatingsConfig({ ...googleRatingsConfig, businessId: e.target.value })}
                placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
              />
              <Form.Text className="text-muted">
                Nájdete v Google Business profile
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Zobraziť Google recenzie"
                checked={googleRatingsConfig.enabled}
                onChange={(e) => setGoogleRatingsConfig({ ...googleRatingsConfig, enabled: e.target.checked })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGoogleRatingsModal(false)}>
            {t?.common?.cancel || 'Zrušiť'}
          </Button>
          <Button variant="primary" onClick={handleGoogleRatingsSave}>
            {t?.common?.save || 'Uložiť'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Join Us Section */}
      <div className="max-w-6xl mx-auto px-6 py-12 rounded-xl shadow-xl bg-overlay-90 backdrop-blur-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h2 className="text-3xl font-bold mb-6 text-secondary">
              Nechajte svoje deti objaviť svet Messy & Sensory Play!
            </h2>
            <p className="mb-8 text-neutral-700 dark:text-neutral-300 text-lg leading-relaxed">
              Doprajte im radosť z tvorenia, farieb a zmyslového objavovania.
              Čakajú ich hravé aktivity, ktoré podporujú kreativitu, jemnú motoriku
              aj prirodzenú zvedavosť.
            </p>

            <div className="relative inline-block">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={handleJoinClick}
                    className="inline-block bg-gray-500 text-white py-3 px-8 rounded-full text-lg font-semibold hover:bg-gray-600 transition-all"
                  >
                    Ste už prihlásený
                  </button>
                  {showTooltip && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap z-50">
                      <div className="flex items-center">
                        <span className="mr-1">ℹ️</span>
                        Ste už prihlásený!
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to="/register"
                  className="inline-block bg-secondary-500 text-white py-3 px-8 rounded-full text-lg font-semibold shadow-md hover:bg-secondary-700 transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  Registrujem sa
                </Link>
              )}
            </div>

            {/* Extra options pre prihlásených */}
            {isLoggedIn && (
              <div className="mt-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  Chcete si pozrieť svoj profil alebo náš rozvrh?
                </p>
                <div className="flex gap-3">
                  <Link
                    to="/profile"
                    className="inline-block bg-primary-500 text-white py-2 px-6 rounded-full text-sm font-semibold shadow-md hover:bg-primary-700 transition-all"
                  >
                    Môj profil
                  </Link>
                  <Link
                    to="/schedule"
                    className="inline-block border border-secondary-500 text-secondary-500 py-2 px-6 rounded-full text-sm font-semibold hover:bg-secondary-500 hover:text-white transition-all"
                  >
                    Rozvrh
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg shadow-lg overflow-hidden">
            <img
              src="/images/nitracik_join_us.jpg"
              alt="Children enjoying messy sensory play at Nitracik"
              className="w-full h-[350px] object-cover"
              onError={(e) => {
                e.target.src = 'https://picsum.photos/500/350?random=6';
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;