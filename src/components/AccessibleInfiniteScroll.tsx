import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface InfiniteScrollItem {
  id: string;
  content: React.ReactNode;
}

interface AccessibleInfiniteScrollProps {
  items: InfiniteScrollItem[];
  loadMore: () => Promise<InfiniteScrollItem[]>;
  hasMore: boolean;
  loading: boolean;
  error?: string | null;
  className?: string;
  itemsPerPage?: number;
  loadMoreThreshold?: number;
  ariaLabel?: string;
  showLoadMoreButton?: boolean;
}

const AccessibleInfiniteScroll: React.FC<AccessibleInfiniteScrollProps> = ({
  items,
  loadMore,
  hasMore,
  loading,
  error,
  className = '',
  itemsPerPage = 10,
  loadMoreThreshold = 200,
  ariaLabel = 'Content list',
  showLoadMoreButton = true
}) => {
  const [displayedItems, setDisplayedItems] = useState<InfiniteScrollItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isManualLoad, setIsManualLoad] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLButtonElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Initialize displayed items
  useEffect(() => {
    setDisplayedItems(items.slice(0, itemsPerPage));
  }, [items, itemsPerPage]);

  // Intersection Observer for automatic loading
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loading && !isManualLoad) {
      handleLoadMore();
    }
  }, [hasMore, loading, isManualLoad]);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: `${loadMoreThreshold}px`,
      threshold: 0.1
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [observerCallback, loadMoreThreshold]);

  // Handle loading more items
  const handleLoadMore = async () => {
    if (loading || !hasMore) return;

    try {
      const newItems = await loadMore();
      const nextPage = currentPage + 1;
      const newDisplayedItems = items.slice(0, nextPage * itemsPerPage);
      
      setDisplayedItems(newDisplayedItems);
      setCurrentPage(nextPage);
      
      // Announce new content to screen readers
      const newItemsCount = newDisplayedItems.length - displayedItems.length;
      setAnnouncement(`Loaded ${newItemsCount} more items. Total items: ${newDisplayedItems.length}`);
      
      // Focus management for manual loads
      if (isManualLoad && newItems.length > 0) {
        setTimeout(() => {
          const firstNewItem = containerRef.current?.children[displayedItems.length] as HTMLElement;
          firstNewItem?.focus();
        }, 100);
      }
      
      setIsManualLoad(false);
    } catch (err) {
      setAnnouncement('Failed to load more items. Please try again.');
    }
  };

  // Manual load more button handler
  const handleManualLoadMore = () => {
    setIsManualLoad(true);
    handleLoadMore();
  };

  // Retry on error
  const handleRetry = () => {
    setIsManualLoad(true);
    handleLoadMore();
  };

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    const items = containerRef.current?.children;
    if (!items) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (index < items.length - 1) {
          (items[index + 1] as HTMLElement).focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (index > 0) {
          (items[index - 1] as HTMLElement).focus();
        }
        break;
      case 'Home':
        event.preventDefault();
        (items[0] as HTMLElement).focus();
        break;
      case 'End':
        event.preventDefault();
        (items[items.length - 1] as HTMLElement).focus();
        break;
    }
  };

  return (
    <div className={`${className}`}>
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Instructions for screen readers */}
      <div className="sr-only">
        Use arrow keys to navigate items, Home and End to go to first or last item.
        {showLoadMoreButton && ' Use the "Load More" button to load additional content.'}
      </div>

      {/* Main content container */}
      <div
        ref={containerRef}
        className="space-y-4"
        role="feed"
        aria-label={ariaLabel}
        aria-describedby="scroll-instructions"
      >
        {displayedItems.map((item, index) => (
          <div
            key={item.id}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
            tabIndex={0}
            role="article"
            aria-posinset={index + 1}
            aria-setsize={hasMore ? -1 : displayedItems.length}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {item.content}
          </div>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8" role="status" aria-label="Loading more content">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600 dark:text-gray-300">Loading more content...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      )}

      {/* Load more button */}
      {hasMore && !loading && !error && showLoadMoreButton && (
        <div className="flex justify-center py-8">
          <button
            ref={loadMoreRef}
            onClick={handleManualLoadMore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            aria-describedby="load-more-description"
          >
            Load More Content
          </button>
          <div id="load-more-description" className="sr-only">
            Click to load {itemsPerPage} more items. Currently showing {displayedItems.length} items.
          </div>
        </div>
      )}

      {/* End of content indicator */}
      {!hasMore && displayedItems.length > 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-300" role="status">
          <p>You've reached the end of the content.</p>
          <p className="text-sm mt-1">Showing all {displayedItems.length} items.</p>
        </div>
      )}

      {/* No content state */}
      {displayedItems.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <p>No content available.</p>
        </div>
      )}
    </div>
  );
};

export default AccessibleInfiniteScroll;