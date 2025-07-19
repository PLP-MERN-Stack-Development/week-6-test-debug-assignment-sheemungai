// components/ErrorBoundary.jsx - Error boundary component

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Error Boundary Component to catch JavaScript errors in child components
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // You can also log the error to a logging service here
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__content">
            <h2>Oops! Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            
            {this.props.showDetails && this.state.error && (
              <details className="error-boundary__details">
                <summary>Error Details</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            
            <div className="error-boundary__actions">
              <button 
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="btn btn-primary"
              >
                Try Again
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  onError: PropTypes.func,
  showDetails: PropTypes.bool,
};

ErrorBoundary.defaultProps = {
  showDetails: process.env.NODE_ENV === 'development',
};

export default ErrorBoundary;
