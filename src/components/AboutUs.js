import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const { user } = useUser();
  const isLoggedIn = user.isLoggedIn;

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

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
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
  }, [currentSlide]);


  return (
    <section className="px-6 py-12 text-center bg-inherit rounded-xl shadow-xl transition-colors duration-300 text-secondary">
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
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            ></button>
          ))}
        </div>
      </div>

      {/* About content */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-secondary mb-4">
          {t?.about?.title || 'About Us'}
        </h2>
        <p className="text-lg leading-relaxed opacity-90">
          {t?.about?.description ||
            'Welcome to Nitracik! We specialize in professional training sessions tailored to your needs. Join us to grow your skills and achieve your goals.'}
        </p>
      </div>

      {/* Join Us Section */}
      <div className="max-w-6xl mx-auto mt-20 px-6 py-12 rounded-xl shadow-xl bg-overlay-90 backdrop-blur-sm dark:bg-neutral-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <h2 className="text-3xl font-bold mb-6 text-secondary">
              Start Your Journey Today!
            </h2>
            <p className="mb-8 text-neutral-700 dark:text-neutral-300 text-lg leading-relaxed">
              Join thousands of satisfied members who have transformed their skills
              with our professional training programs.
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
                  Join Us Today!
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
