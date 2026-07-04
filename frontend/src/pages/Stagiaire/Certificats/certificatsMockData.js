// ─── Mock data for Stagiaire Certificats ────────────────────────────────────

export const MOCK_CERTIFICATS = [
  {
    id: 'cert_001',
    type: 'certificat',
    title: 'Développeur Full-Stack React',
    formation: 'Développement Web',
    date: '2026-03-15',
    score: '98/100',
    icon: '🏆',
    color: '#0a8fa0',
    verified: true,
    skills: ['React', 'Node.js', 'MongoDB', 'Architecture'],
  },
  {
    id: 'cert_002',
    type: 'certificat',
    title: 'Expert SEO & Acquisition',
    formation: 'Marketing',
    date: '2025-11-20',
    score: '92/100',
    icon: '🥇',
    color: '#0a8fa0',
    verified: true,
    skills: ['SEO', 'Google Ads', 'Analytics'],
  }
];

export const MOCK_BADGES = [
  {
    id: 'bdg_001',
    type: 'badge',
    title: 'Maître Python',
    formation: 'Data Science',
    date: '2026-05-02',
    icon: '🐍',
    color: '#10b981', // Vert émeraude
    description: 'A complété avec succès tous les modules Python avancés.',
  },
  {
    id: 'bdg_002',
    type: 'badge',
    title: 'Top Contributeur',
    formation: 'Transversal',
    date: '2026-04-15',
    icon: '🌟',
    color: '#f59e0b', // Ambre doré
    description: 'Récompense l\'aide apportée aux autres stagiaires sur le forum.',
  },
  {
    id: 'bdg_003',
    type: 'badge',
    title: 'Assiduité Parfaite',
    formation: 'Transversal',
    date: '2026-01-30',
    icon: '⏱️',
    color: '#8b5cf6', // Violet
    description: '100% de présence aux sessions live sur un trimestre.',
  }
];

export const MOCK_PROGRESSION = {
  formation: 'Intelligence Artificielle',
  progress: 85,
  nextMilestone: 'Examen Final Pratique',
  timeLeft: '14 jours'
};
