import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // En production, envoyer à un service de monitoring (Sentry, etc.)
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg, #f6f8fa)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Nunito', sans-serif",
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '4rem' }}>⚠️</div>
        <h2 style={{ color: 'var(--primary, #1B9B85)', fontFamily: "'Raleway', sans-serif", fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>
          Une erreur est survenue
        </h2>
        <p style={{ color: 'var(--text-muted, #6b7280)', fontSize: '1rem', maxWidth: '400px' }}>
          Un problème inattendu s'est produit. Veuillez recharger la page ou contacter le support.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'var(--primary, #1B9B85)',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: '28px',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            fontFamily: "'Raleway', sans-serif",
            marginTop: '0.5rem',
          }}
        >
          Recharger la page
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
