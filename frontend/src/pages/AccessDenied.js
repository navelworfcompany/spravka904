import React from 'react';
import './access-denied.css';

const AccessDenied = () => {
  return (
    <div className="access-denied-page">
      <div className="access-denied-container">
        <div className="access-denied-content">
          <div className="access-denied-icon">🚫</div>
          <h1>Доступ запрещен</h1>
          <p className='denied-message'>У вас недостаточно прав для просмотра этой страницы или вы использовали неверные данные для входа.</p>
          <p className='help-me'>Пожалуйста, проверьте вводимые данные или обратись к нам по номеру:</p>
          <p className='help-me-phone'>+7 (995) 537-77-28</p>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;