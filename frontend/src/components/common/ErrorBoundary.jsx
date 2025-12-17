import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Здесь можно отправить ошибку в сервис мониторинга
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Что-то пошло не так</h2>
            <p>Произошла непредвиденная ошибка. Пожалуйста, обновите страницу.</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Обновить страницу
            </button>
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
              {this.state.error && this.state.error.toString()}
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;