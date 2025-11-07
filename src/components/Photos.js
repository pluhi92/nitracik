import React from 'react';
import '../styles/components/Photos.css';

const Photos = () => {
  // Example photo URLs (replace with your actual photos)
  const photos = [
    'https://via.placeholder.com/250',
    'https://via.placeholder.com/250',
    'https://via.placeholder.com/250',
    'https://via.placeholder.com/250',
    'https://via.placeholder.com/250',
    'https://via.placeholder.com/250',
  ];

  return (
    <div className="photos-container">
      <div className="photos">
        {photos.map((photo, index) => (
          <img key={index} src={photo} alt={`Photo ${index + 1}`} />
        ))}
      </div>
    </div>
  );
};

export default Photos;