import { useContext } from 'react';
import { OperatorContext } from '../context/OperatorContext';

export const useReviews = () => {
  console.log('🔄 useReviews вызывается');
  
  const context = useContext(OperatorContext);
  
  if (!context) {
    console.error('❌ OperatorContext не найден!');
    console.error('📌 Проверьте, что компонент обернут в <OperatorProvider>');
    throw new Error('useReviews must be used within OperatorProvider');
  }
  
  console.log('✅ OperatorContext найден:', Object.keys(context));
  
  const {
    reviews,
    reviewsStats,
    reviewsLoading,
    reviewsFilters,
    setReviewsFilters,
    updateReviewStatus,
    refreshReviews,
    refreshReviewsStats,
    addSuccessNotification,
    addErrorNotification
  } = context;
  
  // 🔥 ОТЛАДКА: Проверяем реальные данные
  console.log('📊 Reviews data in useReviews:', {
    reviewsCount: reviews?.length || 0,
    stats: reviewsStats,
    loading: reviewsLoading,
    filters: reviewsFilters
  });
  
  return {
    reviews: reviews || [],
    stats: reviewsStats,
    loading: reviewsLoading,
    filters: reviewsFilters,
    setFilters: setReviewsFilters,
    updateReviewStatus,
    refreshReviews,
    refreshStats: refreshReviewsStats,
    addSuccessNotification,
    addErrorNotification
  };
};