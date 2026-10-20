import { Component } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/* Catches render crashes anywhere below it and shows a recovery screen
   instead of a blank page. Remount (via key) on route change to reset. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('PathCV render error:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <main className="page-width not-found-page">
      <div className="not-found-mark">!</div>
      <div className="eyebrow">SOMETHING WENT WRONG</div>
      <h1>This page hit a snag.</h1>
      <p>Your saved CVs are stored safely in this browser. Try reloading, or head back home and continue from there.</p>
      <div className="hero-actions">
        <button type="button" className="button button-primary button-large" onClick={() => window.location.reload()}>Reload page</button>
        <Link to="/" className="button button-outline button-large">Back to PathCV</Link>
      </div>
    </main>;
  }
}
