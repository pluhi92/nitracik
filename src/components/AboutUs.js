import React, { useState, useEffect } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import '../styles/components/AboutUs.css';

const AboutUs = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Carousel data with your specific images
  const carouselItems = [
    {
      id: 1,
      image: '/images/close-up-kids-painting-with-brushes-together.jpg',
      title: 'Professional Training',
      description: 'Expert-led sessions for all skill levels'
    },
    {
      id: 2,
      image: '/images/elevated-view-two-boys-gathering-confetti-wooden-floor.jpg',
      title: 'Modern Facilities',
      description: 'State-of-the-art equipment and environment'
    },
    {
      id: 3,
      image: '/images/close-up-kids-painting-with-brushes.jpg',
      title: 'Certified Instructors',
      description: 'Qualified professionals with years of experience'
    },
    {
      id: 4,
      image: '/images/little-boy-playing.jpg',
      title: 'Community Focus',
      description: 'Join our growing community of learners'
    },
    {
      id: 5,
      image: '/images/small-baby-play-with-ribbed-rug.jpg',
      title: 'Flexible Scheduling',
      description: 'Sessions available at convenient times'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide]);

  return (
    <section className="about-us">
      {/* Image Carousel */}
      <div className="carousel-container">
        <div 
          className="carousel-track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {carouselItems.map((item) => (
            <div key={item.id} className="carousel-slide">
              <img 
                src={item.image} 
                alt={item.title}
                className="carousel-image"
                onError={(e) => {
                  // Fallback if image doesn't load
                  e.target.src = `https://picsum.photos/1200/400?random=${item.id}`;
                }}
              />
              <div className="carousel-caption">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <button className="carousel-btn prev" onClick={prevSlide} aria-label="Previous slide">
          ‹
        </button>
        <button className="carousel-btn next" onClick={nextSlide} aria-label="Next slide">
          ›
        </button>

        {/* Indicators */}
        <div className="carousel-indicators">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              className={`carousel-indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* About Us Content */}
      <div className="container">
        <h2 className="about-us-title">{t?.about?.title || 'About Us'}</h2>
        <p className="about-us-description">
          {t?.about?.description || 'Welcome to Nitracik! We specialize in professional training sessions tailored to your needs. Join us to grow your skills and achieve your goals.'}
        </p>
      </div>

         {/* Join Us Section */}
      <div className="join-us-section">
        <div className="join-us-content">
          <h2>Start Your Journey Today!</h2>
          <p>
            Join thousands of satisfied members who have transformed their skills with our 
            professional training programs. Whether you're a beginner or looking to advance 
            your expertise, we have the perfect path for you.
          </p>
          
          <ul className="join-us-features">
            <li>Access to all training sessions</li>
            <li>Expert instructors and modern facilities</li>
            <li>Flexible scheduling options</li>
            <li>Supportive community environment</li>
            <li>Affordable pricing plans</li>
          </ul>

          <Link to="/register" className="join-us-button">
            Join Us Today!
          </Link>
        </div>
        
        <div className="join-us-image">
          <img 
            src="/images/nitracik_join_us.jpg" 
            alt="Children enjoying messy sensory play at Nitracik"
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