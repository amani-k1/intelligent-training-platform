// ─── Mock data for Stagiaire Planning ────────────────────────────────────

const _now = new Date();
const currentYear  = _now.getFullYear();
const currentMonth = _now.getMonth(); // 0-index, mois réel

// Helper pour générer une date au format YYYY-MM-DD
const getDateStr = (day) => {
  const d = new Date(currentYear, currentMonth, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const MOCK_EVENTS = [
  {
    id: 'e1',
    title: 'Session Live - Intro Machine Learning',
    formation: 'Intelligence Artificielle',
    color: '#0a8fa0', // Cyan BRN SMART
    type: 'live', // live, deadline, quiz, reminder
    date: getDateStr(5),
    time: '10:00',
    duration: 120, // minutes
    description: 'Introduction aux concepts clés du Machine Learning avec Dr. Karim Benali. Préparez vos questions.',
    link: 'https://zoom.us/j/123456789'
  },
  {
    id: 'e2',
    title: 'Rendu Projet Final Ads',
    formation: 'Marketing',
    color: '#0a8fa0', // Mêmes couleurs unifiées comme demandé
    type: 'deadline',
    date: getDateStr(8),
    time: '23:59',
    duration: 0,
    description: 'Dépôt du projet de campagne publicitaire sur la plateforme. Attention, aucun retard ne sera toléré.',
    link: null
  },
  {
    id: 'e3',
    title: 'Quiz SEO Off-Page',
    formation: 'Marketing',
    color: '#0a8fa0',
    type: 'quiz',
    date: getDateStr(12),
    time: '14:00',
    duration: 45,
    description: 'Quiz de validation des acquis sur le module SEO Off-Page (20 questions QCM).',
    link: '/dashboard/stagiaire/formations'
  },
  {
    id: 'e4',
    title: 'Session Live - React Hooks',
    formation: 'Développement Web',
    color: '#0a8fa0',
    type: 'live',
    date: getDateStr(15),
    time: '09:00',
    duration: 180,
    description: 'Atelier pratique sur useState, useEffect et useContext. Environnement de développement requis.',
    link: 'https://zoom.us/j/987654321'
  },
  {
    id: 'e5',
    title: 'Session Live - Pandas & Matplotlib',
    formation: 'Data Science',
    color: '#0a8fa0',
    type: 'live',
    date: getDateStr(20),
    time: '15:30',
    duration: 120,
    description: 'Manipulation et visualisation de données avec Python.',
    link: 'https://zoom.us/j/456123789'
  },
  {
    id: 'e6',
    title: 'Dépôt Exercice Pratique',
    formation: 'Data Science',
    color: '#0a8fa0',
    type: 'deadline',
    date: getDateStr(22),
    time: '18:00',
    duration: 0,
    description: 'Exercice d\'analyse d\'un dataset immobilier (Jupyter Notebook attendu).',
    link: null
  },
  {
    id: 'e7',
    title: 'Examen de certification IA',
    formation: 'Intelligence Artificielle',
    color: '#0a8fa0',
    type: 'quiz',
    date: getDateStr(28),
    time: '10:00',
    duration: 120,
    description: 'Examen final pour l\'obtention du certificat IA pour Décideurs.',
    link: '/dashboard/stagiaire/formations'
  }
];

export const FORMATIONS_LIST = [
  { id: 'f1', name: 'Intelligence Artificielle', color: '#0a8fa0' },
  { id: 'f2', name: 'Marketing', color: '#0a8fa0' },
  { id: 'f3', name: 'Développement Web', color: '#0a8fa0' },
  { id: 'f4', name: 'Data Science', color: '#0a8fa0' }
];
