import React, { useState, useRef, useEffect } from 'react';

/**
 * Video Background Component
 * Renders an IOT-themed animated video background with fallback
 * Optimized for performance and mobile devices
 */
export function VideoBackground({ 
  videoSrc = '/assets/videos/iot-animation.mp4',
  posterImage = '/assets/images/iot-poster.jpg',
  autoPlay = true,
  muted = true,
  loop = true,
  className = ''
}) {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Attempt to autoplay
      if (autoPlay) {
        video.play().catch(err => {
          console.warn('Autoplay failed, likely due to browser policy:', err);
        });
      }
    }
  }, [autoPlay]);

  const handleCanPlay = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Video Background */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-500`}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        poster={posterImage}
        onCanPlay={handleCanPlay}
        aria-label="IOT-themed animated background video"
      >
        <source src={videoSrc} type="video/mp4" />
        <img src={posterImage} alt="IOT background" className="w-full h-full object-cover" />
      </video>

      {/* Fallback for unsupported browsers */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-black bg-cover bg-center"
          style={{ backgroundImage: `url(${posterImage})` }}
          role="img"
          aria-label="Background image"
        />
      )}

      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>

      {/* Mobile Optimization: Reduce video quality on mobile */}
      {isMobile && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-black opacity-30"></div>
      )}
    </div>
  );
}

/**
 * Hero Section with Video Background
 * Premium landing page hero with video background and animated text
 */
export function HeroSection({ 
  title = "ARTIX 2026",
  subtitle = "Advanced Robotics and IoT Innovation eXchange",
  callToAction = "Register Now",
  onCTAClick = () => {},
  videoSrc = '/assets/videos/iot-animation.mp4',
  posterImage = '/assets/images/iot-poster.jpg'
}) {
  const [bgColor, setBgColor] = useState('#000000');

  useEffect(() => {
    // Load background color preference from localStorage
    const savedColor = localStorage.getItem('artix_bg_color');
    if (savedColor) {
      setBgColor(savedColor);
    }
  }, []);

  return (
    <div 
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
      style={{ 
        backgroundColor: bgColor,
        transition: 'background-color 0.3s ease-in-out'
      }}
    >
      {/* Video Background */}
      <VideoBackground 
        videoSrc={videoSrc}
        posterImage={posterImage}
        autoPlay={true}
        muted={true}
        loop={true}
      />

      {/* Content Container */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Animated Title */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 animate-fade-in drop-shadow-lg leading-tight">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-xl sm:text-2xl text-gray-100 mb-8 animate-fade-in-delay-1 drop-shadow-md font-light">
          {subtitle}
        </p>

        {/* CTA Button */}
        <button
          onClick={onCTAClick}
          className="inline-flex items-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl animate-fade-in-delay-2"
          aria-label={callToAction}
        >
          <span>{callToAction}</span>
          <span className="ml-2">→</span>
        </button>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg 
            className="w-6 h-6 text-white' opacity-75"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  );
}

/**
 * Background Color Selector Component
 * Allows users to customize landing page background color
 */
export function BackgroundColorSelector({ 
  onColorChange = () => {},
  defaultColor = '#000000'
}) {
  const [selectedColor, setSelectedColor] = useState(defaultColor);
  const colorPresets = [
    { name: 'Midnight', value: '#000000' },
    { name: 'Deep Blue', value: '#0F172A' },
    { name: 'Navy', value: '#001F3F' },
    { name: 'Purple', value: '#1E0B46' },
    { name: 'Charcoal', value: '#1F2937' },
    { name: 'Dark Blue', value: '#1E3A5F' }
  ];

  const handleColorChange = (color) => {
    setSelectedColor(color);
    localStorage.setItem('artix_bg_color', color);
    onColorChange(color);
  };

  const handleCustomColor = (e) => {
    const color = e.target.value;
    setSelectedColor(color);
    localStorage.setItem('artix_bg_color', color);
    onColorChange(color);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <span className="w-6 h-6 rounded-full mr-2" style={{ backgroundColor: selectedColor }}></span>
        Customize Background Color
      </h3>

      {/* Preset Colors */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {colorPresets.map(preset => (
          <button
            key={preset.value}
            onClick={() => handleColorChange(preset.value)}
            className={`relative w-full aspect-square rounded-lg transition-all duration-200 transform hover:scale-110 group`}
            style={{ backgroundColor: preset.value }}
            aria-label={`Select ${preset.name} background color`}
            title={preset.name}
          >
            {selectedColor === preset.value && (
              <div className="absolute inset-0 border-2 border-white rounded-lg shadow-lg">
                <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium">
                  {preset.name}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Picker */}
      <div className="flex items-center gap-4">
        <label htmlFor="custom-color" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Custom Color:
        </label>
        <input
          id="custom-color"
          type="color"
          value={selectedColor}
          onChange={handleCustomColor}
          className="w-16 h-10 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
          aria-label="Custom background color picker"
        />
        <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{selectedColor}</span>
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        Your preference is saved locally and will be remembered on your next visit.
      </p>
    </div>
  );
}

/**
 * CSS Animations for Hero Section
 * Add to your global CSS or tailwind config
 */
export const heroAnimationStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes blob {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -50px) scale(1.1);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.9);
    }
  }

  .animate-fade-in {
    animation: fadeIn 0.8s ease-out;
  }

  .animate-fade-in-delay-1 {
    animation: fadeIn 0.8s ease-out 0.2s both;
  }

  .animate-fade-in-delay-2 {
    animation: fadeIn 0.8s ease-out 0.4s both;
  }

  .animate-blob {
    animation: blob 7s infinite;
  }

  .animation-delay-2000 {
    animation-delay: 2s;
  }

  .animation-delay-4000 {
    animation-delay: 4s;
  }
`;

export default {
  VideoBackground,
  HeroSection,
  BackgroundColorSelector,
  heroAnimationStyles
};
