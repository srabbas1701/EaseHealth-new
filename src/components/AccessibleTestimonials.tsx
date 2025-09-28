import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote, MapPin } from 'lucide-react';

interface Testimonial {
  id: string;
  text: string;
  author: string;
  location: string;
  rating: number;
  avatar?: string;
  role?: string;
}

interface AccessibleTestimonialsProps {
  testimonials: Testimonial[];
  autoPlay?: boolean;
  showRatings?: boolean;
  className?: string;
}

const AccessibleTestimonials: React.FC<AccessibleTestimonialsProps> = ({
  testimonials,
  autoPlay = false,
  showRatings = true,
  className = ''
}) => {
  const [preferredFormat, setPreferredFormat] = useState<'carousel' | 'list'>('carousel');

  // Simple carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const total = testimonials.length;
  const goPrev = useCallback(() => setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1)), [total]);
  const goNext = useCallback(() => setCurrentIndex((prev) => (prev + 1) % total), [total]);

  // Auto-advance carousel
  useEffect(() => {
    if (!(autoPlay && preferredFormat === 'carousel')) return;
    setProgress(0);
    const stepMs = 70; // ~7s cycle
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + 1.5;
      });
    }, stepMs);
    return () => clearInterval(interval);
  }, [autoPlay, preferredFormat, goNext]);

  // Reset progress when slide changes
  useEffect(() => {
    if (preferredFormat === 'carousel') setProgress(0);
  }, [currentIndex, preferredFormat]);

  // List view for users who prefer reduced motion or static content
  const ListView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="Customer testimonials">
      {testimonials.map((testimonial, index) => (
        <div key={testimonial.id} role="listitem" aria-posinset={index + 1} aria-setsize={testimonials.length}>
          <TestimonialCard testimonial={testimonial} showRatings={showRatings} />
        </div>
      ))}
    </div>
  );

  // Simple carousel view
  const CarouselView = () => (
    <div
      className="relative max-w-5xl mx-auto"
      role="region"
      aria-roledescription="carousel"
      aria-label="Patient testimonials"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      }}
      tabIndex={0}
    >
      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-100 ease-linear"
          style={{ width: `${Math.min(progress, 100)}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="overflow-hidden rounded-2xl">
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.id} className="w-full flex-shrink-0 px-1">
              <div className={`transform transition-all duration-500 ${index === currentIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-80'}`}>
                <TestimonialCard testimonial={testimonial} showRatings={showRatings} />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation buttons */}
      <button
        onClick={goPrev}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Next testimonial"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Pagination dots */}
      <div className="mt-4 flex items-center justify-center space-x-2" role="tablist" aria-label="Select testimonial slide">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentIndex ? 'bg-blue-600 w-6' : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'}`}
            role="tab"
            aria-selected={i === currentIndex}
            aria-label={`Show testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className={className}>
      {/* Format toggle for accessibility */}
      <div className="mb-6 flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1 flex shadow-inner" role="tablist" aria-label="Testimonial display format">
          <button
            onClick={() => setPreferredFormat('carousel')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              preferredFormat === 'carousel'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            role="tab"
            aria-selected={preferredFormat === 'carousel'}
            aria-controls="testimonials-content"
          >
            Slideshow
          </button>
          <button
            onClick={() => setPreferredFormat('list')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              preferredFormat === 'list'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
            role="tab"
            aria-selected={preferredFormat === 'list'}
            aria-controls="testimonials-content"
          >
            List View
          </button>
        </div>
      </div>

      {/* Content area */}
      <div id="testimonials-content" role="tabpanel">
        {preferredFormat === 'carousel' ? (
          <CarouselView />
        ) : (
          <ListView />
        )}
      </div>

      {/* Summary for screen readers */}
      <div className="sr-only">
        Summary: {testimonials.length} customer testimonials with an average rating of{' '}
        {(testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)} stars.
      </div>
    </div>
  );
};

// Individual testimonial card component
const TestimonialCard: React.FC<{ 
  testimonial: Testimonial; 
  showRatings: boolean;
}> = ({ testimonial, showRatings }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Quote icon */}
      <div className="flex justify-center mb-4">
        <Quote className="w-8 h-8 text-blue-600 dark:text-blue-400 opacity-50" />
      </div>

      {/* Rating */}
      {showRatings && (
        <div className="flex justify-center mb-4" role="img" aria-label={`${testimonial.rating} out of 5 stars`}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 ${
                i < testimonial.rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          ))}
        </div>
      )}

      {/* Testimonial text */}
      <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-6 text-center italic leading-relaxed">
        "{testimonial.text}"
      </blockquote>

      {/* Author info */}
      <div className="flex items-center justify-center">
        {testimonial.avatar ? (
          <img
            src={testimonial.avatar}
            alt=""
            className="w-12 h-12 rounded-full mr-4"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold mr-4">
            {testimonial.author.charAt(0)}
          </div>
        )}
        <div className="text-center">
          <p className="font-bold text-gray-900 dark:text-gray-100">
            {testimonial.author}
          </p>
          {testimonial.role && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {testimonial.role}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
            <MapPin className="w-4 h-4 mr-1" />
            {testimonial.location}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessibleTestimonials;