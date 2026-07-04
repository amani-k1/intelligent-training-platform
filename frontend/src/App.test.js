import { render, screen } from '@testing-library/react';
import ErrorBoundary from './components/ErrorBoundary';

// ── ErrorBoundary ────────────────────────────────────────────────────────────

const CrashingComponent = () => {
  throw new Error('Crash intentionnel pour le test');
};

test('ErrorBoundary affiche le message d\'erreur si un composant crash', () => {
  // Supprimer les logs d'erreur attendus dans la console pendant ce test
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  render(
    <ErrorBoundary>
      <CrashingComponent />
    </ErrorBoundary>
  );

  expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();

  consoleSpy.mockRestore();
});

test('ErrorBoundary affiche les enfants normalement sans erreur', () => {
  render(
    <ErrorBoundary>
      <p>Contenu normal</p>
    </ErrorBoundary>
  );

  expect(screen.getByText('Contenu normal')).toBeInTheDocument();
});
