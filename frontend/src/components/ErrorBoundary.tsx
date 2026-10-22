import { Component, ReactNode } from 'react';

interface State { failed: boolean }

// Last line of defence: if rendering fails, show a way out instead of a blank page
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('FarmLink failed to render:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-sm text-center">
          <p className="font-display text-xl font-semibold text-gray-900">Something went wrong loading FarmLink</p>
          <p className="mt-2 text-sm text-gray-600">This usually clears up with a reload. If it keeps happening, try again in a minute.</p>
          <button onClick={() => window.location.reload()} className="btn-md btn-primary mt-5">Reload</button>
        </div>
      </div>
    );
  }
}
