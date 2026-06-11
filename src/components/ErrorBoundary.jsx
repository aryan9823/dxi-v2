import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Page crashed:', this.props.name || 'Unknown', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">
            {this.props.name || 'This page'} encountered an error
          </h2>
          <p className="text-sm text-[#999] mb-6 max-w-sm">
            {this.state.error?.message || 'Something went wrong. Other pages are unaffected.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-xl bg-[#1A1A1A] px-6 py-3 text-sm font-bold text-white hover:bg-[#333]"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
