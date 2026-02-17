import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-lg border-0">
            <div className="card-body text-center py-5">
              {/* 404 Icon */}
              <div className="mb-4">
                <img 
                  src="/images/sad_nitracik.png" 
                  alt="Sad Nitracik" 
                  style={{ width: '150px', height: 'auto', margin: '0 auto' }}
                />
              </div>
              
              {/* Main Title */}
              <h1 className="h2 fw-bold mb-3" style={{ color: '#333' }}>
                {t?.notFound?.title || '404 – stránka sa nenašla :('}
              </h1>
              
              {/* Description */}
              <p className="lead text-muted mb-4">
                {t?.notFound?.description || 'Vyzerá to tak, že hľadaný obsah ešte nebol vytvorený alebo sa stratil niekde vo virtuálnom priestore.'}
              </p>
              
              {/* Funny Message */}
              <div className="alert alert-light border mb-4 p-3" style={{ backgroundColor: '#f8f9fa' }}>
                <p className="mb-0 text-secondary">
                  <strong>💡 {t?.notFound?.funnyTitle || 'Tip od Messy!'}</strong><br />
                  {t?.notFound?.funnyText || 'Možno sa stránka stratila rovnako ako ponožky v práčke, alebo sa zahrabala v senzorických guličkách niekde na hracom poli. Skúste ju nájsť na domovskej stránke! 🎨'}
                </p>
              </div>
              
              {/* Back to Home Button */}
              <Link 
                to="/" 
                className="btn btn-primary btn-lg px-5 py-3 shadow-sm"
                style={{ 
                  backgroundColor: '#4A90E2',
                  borderColor: '#4A90E2',
                  borderRadius: '25px',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#357ABD';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#4A90E2';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {t?.notFound?.homeButton || 'Späť na domovskú stránku'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
