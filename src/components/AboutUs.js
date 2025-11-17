import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1));
  const goToSlide = (index) => setCurrentSlide(index);

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

        {/* Navigation controls */}
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
                index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
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
      <div className="flex flex-col md:flex-row gap-12 items-center justify-between max-w-6xl mx-auto mt-20 px-6 py-12 rounded-xl shadow-xl bg-overlay-90 backdrop-blur-sm dark:bg-neutral-800/80">
        <div className="flex-1 text-left">
          <h2 className="text-3xl font-bold mb-4">Start Your Journey Today!</h2>
          <p className="mb-6 text-neutral-700 dark:text-neutral-300">
            Join thousands of satisfied members who have transformed their skills with our
            professional training programs. Whether you're a beginner or looking to advance
            your expertise, we have the perfect path for you.
          </p>
          <ul className="space-y-3 mb-6 text-neutral-700 dark:text-neutral-300">
            {[
              'Access to all training sessions',
              'Expert instructors and modern facilities',
              'Flexible scheduling options',
              'Supportive community environment',
              'Affordable pricing plans',
            ].map((item, i) => (
              <li key={i} className="flex items-center">
                <span className="bg-secondary-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            to="/register"
            className="inline-block bg-secondary-500 text-white py-3 px-8 rounded-full text-lg font-semibold shadow-md hover:bg-secondary-700 transition-transform hover:-translate-y-1"
          >
            Join Us Today!
          </Link>
        </div>
        <div className="flex-1 rounded-lg shadow-lg overflow-hidden">
          <img
            src="/images/nitracik_join_us.jpg"
            alt="Children enjoying messy sensory play at Nitracik"
            className="w-full h-[350px] object-cover"
            onError={(e) => {
              e.target.src = 'https://picsum.photos/500/500?random=6';
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
