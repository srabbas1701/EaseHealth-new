import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote, MapPin } from 'lucide-react';
import AccessibleCarousel from './AccessibleCarousel';

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

  // Detect user preference for motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Keep slideshow as default even for reduced motion users, but they can switch to list view
  }, []);

  // Convert testimonials to carousel items
  const carouselItems = testimonials.map(testimonial => ({
    id: testimonial.id,
    title: `Testimonial from ${testimonial.author}`,
    description: `${testimonial.rating} star review from ${testimonial.location}`,
    content: (
      <TestimonialCard 
        testimonial={testimonial} 
        showRatings={showRatings}
      />
    )
  }));

  // List view for users who prefer reduced motion or static content
  const ListView = () => (
    <div className="space-y-6" role="list" aria-label="Customer testimonials">
      {testimonials.map((testimonial, index) => (
        <div key={testimonial.id} role="listitem" aria-posinset={index + 1} aria-setsize={testimonials.length}>
          <TestimonialCard testimonial={testimonial} showRatings={showRatings} />
        </div>
      ))}
    </div>
  );

  return (
    <div className={className}>
      {/* Format toggle for accessibility */}
      <div className="mb-6 flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex" role="tablist" aria-label="Testimonial display format">
          <button
            onClick={() => setPreferredFormat('carousel')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              preferredFormat === 'carousel'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
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
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              preferredFormat === 'list'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
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
          <AccessibleCarousel
            items={carouselItems}
            autoPlay={autoPlay}
            autoPlayInterval={7000}
            ariaLabel="Customer testimonials slideshow"
            className="max-w-4xl mx-auto"
          />
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