import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import Chatbot from './components/Chatbot';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages chargées immédiatement (chemin critique — login/accueil)
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';

// Toutes les autres pages en lazy loading (bundle splitting)
const ContactPage                = lazy(() => import('./pages/ContactPage'));
const NosFormateursPage          = lazy(() => import('./pages/NosFormateursPage'));
const FormationDetailsPage       = lazy(() => import('./pages/FormationDetailsPage'));
const FormationRegistrationPage  = lazy(() => import('./pages/FormationRegistrationPage'));
const UserProfilePage            = lazy(() => import('./pages/UserProfilePage'));
const NotificationsPage          = lazy(() => import('./pages/NotificationsPage'));

const DashboardStagiaire         = lazy(() => import('./pages/DashboardStagiaire'));
const StagiaireMesFormations     = lazy(() => import('./pages/Stagiaire/MesFormations/StagiaireMesFormations'));
const StagiairePlanningPage      = lazy(() => import('./pages/Stagiaire/Planning/StagiairePlanningPage'));

const DashboardFormateur         = lazy(() => import('./pages/DashboardFormateur'));
const FormateurMesFormations     = lazy(() => import('./pages/Trainer/MesFormations/FormateurMesFormations'));
const FormationDetailDashboard   = lazy(() => import('./pages/Trainer/MesFormations/FormationDetailDashboard'));
const TrainerStagiairesPage      = lazy(() => import('./pages/Trainer/Stagiaires/TrainerStagiairesPage'));
const FormateurDemandesPage      = lazy(() => import('./pages/Trainer/Demandes/FormateurDemandesPage'));
const FormationManagePage        = lazy(() => import('./pages/FormationManagePage'));

const DashboardAdmin             = lazy(() => import('./pages/DashboardAdmin'));
const RegistrationRequestsPage   = lazy(() => import('./pages/RegistrationRequestsPage'));
const AdminFormationsPage        = lazy(() => import('./pages/AdminFormationsPage'));
const UserManagementPage         = lazy(() => import('./pages/UserManagementPage'));
const AdminBadgesPage            = lazy(() => import('./pages/AdminBadgesPage'));
const AdminFinancePage           = lazy(() => import('./pages/AdminFinancePage'));
const AdminAIPage                = lazy(() => import('./pages/AdminAIPage'));
const DashboardAnalytics         = lazy(() => import('./components/DashboardAnalytics'));

const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
    <div style={{ width: 40, height: 40, border: '3px solid var(--primary, #1B9B85)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ── Étape 2 — Pages publiques ── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* ── Étape 3 — Login ── */}
          <Route path="/login" element={<LoginPage />} />

          {/* ── Nos Formateurs ── */}
          <Route path="/formateurs" element={<NosFormateursPage />} />

          {/* ── Formations ── */}
          <Route path="/formations" element={<Navigate to="/" replace />} />
          <Route path="/formations/details/:id" element={<FormationDetailsPage />} />
          <Route path="/formations/register/:id" element={<FormationRegistrationPage />} />

          {/* ── Étape 4 — Dashboard Stagiaire (protégé) ── */}
          <Route path="/dashboard/stagiaire" element={<ProtectedRoute requiredRole="stagiaire"><DashboardStagiaire /></ProtectedRoute>} />
          <Route path="/dashboard/stagiaire/:id" element={<ProtectedRoute requiredRole="stagiaire"><DashboardStagiaire /></ProtectedRoute>} />
          <Route path="/dashboard/stagiaire/:id/formations" element={<ProtectedRoute requiredRole="stagiaire"><StagiaireMesFormations /></ProtectedRoute>} />
          <Route path="/dashboard/stagiaire/:id/planning" element={<ProtectedRoute requiredRole="stagiaire"><StagiairePlanningPage /></ProtectedRoute>} />
          <Route path="/dashboard/stagiaire/:id/profil" element={<ProtectedRoute requiredRole="stagiaire"><UserProfilePage /></ProtectedRoute>} />
          <Route path="/dashboard/stagiaire/:id/notifications" element={<ProtectedRoute requiredRole="stagiaire"><NotificationsPage userRole="stagiaire" /></ProtectedRoute>} />
          <Route path="/dashboard/notifications" element={<ProtectedRoute requiredRole="stagiaire"><NotificationsPage userRole="stagiaire" /></ProtectedRoute>} />

          {/* ── Étape 5 — Dashboard Formateur (protégé) ── */}
          <Route path="/dashboard/formateur" element={<ProtectedRoute requiredRole="formateur"><DashboardFormateur /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/formations" element={<ProtectedRoute requiredRole="formateur"><FormateurMesFormations /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/stagiaires" element={<ProtectedRoute requiredRole="formateur"><TrainerStagiairesPage /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/formation/:id" element={<ProtectedRoute requiredRole="formateur"><FormationDetailDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/manage/:id" element={<ProtectedRoute requiredRole="formateur"><FormationManagePage /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/demandes" element={<ProtectedRoute requiredRole="formateur"><FormateurDemandesPage /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/notifications" element={<ProtectedRoute requiredRole="formateur"><NotificationsPage userRole="formateur" /></ProtectedRoute>} />
          {/* Routes formateur avec id explicite */}
          <Route path="/dashboard/formateur/:id" element={<ProtectedRoute requiredRole="formateur"><DashboardFormateur /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/:id/formations" element={<ProtectedRoute requiredRole="formateur"><FormateurMesFormations /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/:id/stagiaires" element={<ProtectedRoute requiredRole="formateur"><TrainerStagiairesPage /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/:id/demandes" element={<ProtectedRoute requiredRole="formateur"><FormateurDemandesPage /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/:id/formation/:fid" element={<ProtectedRoute requiredRole="formateur"><FormationDetailDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/:id/notifications" element={<ProtectedRoute requiredRole="formateur"><NotificationsPage userRole="formateur" /></ProtectedRoute>} />
          <Route path="/dashboard/formateur/:id/profil" element={<ProtectedRoute requiredRole="formateur"><UserProfilePage /></ProtectedRoute>} />

          {/* ── Étape 6 — Dashboard Admin (protégé) ── */}
          <Route path="/dashboard/admin" element={<ProtectedRoute requiredRole="admin"><DashboardAdmin /></ProtectedRoute>} />
          <Route path="/dashboard/admin/demandes" element={<ProtectedRoute requiredRole="admin"><RegistrationRequestsPage /></ProtectedRoute>} />
          <Route path="/dashboard/admin/formations" element={<ProtectedRoute requiredRole="admin"><AdminFormationsPage /></ProtectedRoute>} />
          <Route path="/dashboard/admin/utilisateurs" element={<ProtectedRoute requiredRole="admin"><UserManagementPage /></ProtectedRoute>} />
          <Route path="/dashboard/admin/badges" element={<ProtectedRoute requiredRole="admin"><AdminBadgesPage /></ProtectedRoute>} />
          <Route path="/dashboard/admin/finance" element={<ProtectedRoute requiredRole="admin"><AdminFinancePage /></ProtectedRoute>} />
          <Route path="/dashboard/admin/ia" element={<ProtectedRoute requiredRole="admin"><AdminAIPage /></ProtectedRoute>} />
          <Route path="/dashboard/admin/analytics" element={<ProtectedRoute requiredRole="admin"><DashboardAnalytics /></ProtectedRoute>} />

          {/* ── Profil ── */}
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/dashboard/stagiaire/profil" element={<UserProfilePage />} />
          <Route path="/dashboard/formateur/profil" element={<UserProfilePage />} />
          <Route path="/dashboard/admin/profil" element={<UserProfilePage />} />


          {/* ── 404 ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <Chatbot />
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

const NotFound = () => (
  <div style={{
    minHeight: '100vh', background: 'var(--bg)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Nunito', sans-serif",
    gap: '1rem', padding: '2rem', textAlign: 'center',
  }}>
    <div style={{ fontSize: '5rem' }}>🔍</div>
    <h2 style={{ color: 'var(--primary)', fontFamily: "'Raleway', sans-serif", fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
      404
    </h2>
    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Page introuvable</p>
    <a href="/" style={{
      background: 'var(--primary)', color: '#fff',
      padding: '0.75rem 2rem', borderRadius: '28px',
      textDecoration: 'none', fontWeight: 700,
      fontFamily: "'Raleway', sans-serif", marginTop: '0.5rem',
    }}>← Retour à l'accueil</a>
  </div>
);

export default App;
