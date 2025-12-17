import React from 'react';
import './ReviewsLoading.css';

const ReviewsLoading = () => {
  return (
    <div className="operator-reviews-loading-skeleton">
      <div className="operator-loading-header">
        <div className="operator-loading-title"></div>
        <div className="operator-loading-subtitle"></div>
      </div>
      
      <div className="operator-loading-stats">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="operator-loading-stat"></div>
        ))}
      </div>
      
      <div className="operator-loading-filters">
        <div className="operator-loading-filter"></div>
      </div>
      
      <div className="operator-loading-table">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="operator-loading-row"></div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsLoading;