import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';

interface CarouselItem {
  id: string;
  content: React.ReactNode;
  title: string;
  description?: string;
}

interface AccessibleCarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
  ariaLabel?: string;
}

const AccessibleCarousel: React.FC<AccessibleCarouselProps> = ({
  items,
  autoPlay = false,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  className = '',
  ariaLabel = 'Content carousel'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && !isUserInteracting && items.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      }, autoPlayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isUserInteracting, items.length, autoPlayInterval]);

  // Pause on hover/focus
  const handleMouseEnter = () => setIsUserInteracting(true);
  const handleMouseLeave = () => setIsUserInteracting(false);
  const handleFocus = () => setIsUserInteracting(true);
  const handleBlur = () => setIsUserInteracting(false);

  // Navigation functions
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    announceSlideChange(index);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = (currentIndex + 1) % items.length;
    goToSlide(newIndex);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const restartCarousel = () => {
    setCurrentIndex(0);
    setIsPlaying(true);
    announceSlideChange(0);
  };

  // Announce slide changes to screen readers
  const announceSlideChange = (index: number) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = `Showing slide ${index + 1} of ${items.length}: ${items[index].title}`;
    }
  };

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        goToNext();
        break;
      case 'Home':
        event.preventDefault();
        goToSlide(0);
        break;
      case 'End':
        event.preventDefault();
        goToSlide(items.length - 1);
        break;
      case ' ':
        event.preventDefault();
        togglePlayPause();
        break;
    }
  };

  if (items.length === 0) {
    return <div className="text-center p-8 text-gray-500">No items to display</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      {/* Main carousel container */}
      <div
        ref={carouselRef}
        className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-lg"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
        aria-describedby="carousel-instructions"
      >
        {/* Instructions for screen readers */}
        <div id="carousel-instructions" className="sr-only">
          Use arrow keys to navigate slides, spacebar to pause/play, Home and End to go to first or last slide.
        </div>

        {/* Slides container */}
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          aria-live="polite"
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className="w-full flex-shrink-0"
              aria-hidden={index !== currentIndex}
              role="tabpanel"
              aria-labelledby={`slide-${index}-tab`}
            >
              <div className="p-6">
                {item.content}
                {item.description && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation controls */}
        {showControls && items.length > 1 && (
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
            <button
              onClick={goToPrevious}
              className="ml-4 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors pointer-events-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Go to previous slide. Currently showing slide ${currentIndex + 1} of ${items.length}`}
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={goToNext}
              className="mr-4 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors pointer-events-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Go to next slide. Currently showing slide ${currentIndex + 1} of ${items.length}`}
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        )}

        {/* Play/Pause controls */}
        {autoPlay && items.length > 1 && (
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={togglePlayPause}
              className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isPlaying ? 'Pause carousel' : 'Play carousel'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              ) : (
                <Play className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={restartCarousel}
              className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Restart carousel from beginning"
            >
              <RotateCcw className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        )}
      </div>

      {/* Slide indicators */}
      {showIndicators && items.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2" role="tablist" aria-label="Slide navigation">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                index === currentIndex
                  ? 'bg-blue-600 dark:bg-blue-400'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
              aria-label={`Go to slide ${index + 1}: ${item.title}`}
              aria-selected={index === currentIndex}
              role="tab"
              id={`slide-${index}-tab`}
            />
          ))}
        </div>
      )}

      {/* Progress indicator */}
      {items.length > 1 && (
        <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Slide {currentIndex + 1} of {items.length}
        </div>
      )}
    </div>
  );
};

export default AccessibleCarousel;