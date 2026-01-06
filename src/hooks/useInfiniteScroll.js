import { useState, useEffect, useCallback } from 'react';

// Hook for infinite scroll functionality
export const useInfiniteScroll = (fetchMore, hasMore = true, threshold = 100) => {
  const [isFetching, setIsFetching] = useState(false);

  const handleScroll = useCallback(() => {
    if (!hasMore || isFetching) return;

    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      setIsFetching(true);
    }
  }, [hasMore, isFetching, threshold]);

  useEffect(() => {
    if (!isFetching) return;

    const fetchMoreData = async () => {
      try {
        await fetchMore();
      } catch (error) {
        console.error('Error fetching more data:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchMoreData();
  }, [isFetching, fetchMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { isFetching, setIsFetching };
};

export default useInfiniteScroll;
