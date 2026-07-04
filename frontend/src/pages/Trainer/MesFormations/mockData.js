// src/pages/Trainer/MesFormations/mockData.js

export const mockStats = {
  activeFormations: 12,
  totalStudents: 1240,
  studentsVariation: "+8%",
  avgRating: 4.8,
  ratingVariation: "+0.1",
  monthlyRevenue: "15.2K KDA",
  revenueVariation: "+12.5%",
  revenueGoal: 78,
  platformAvgRating: 4.5,
  platformAvgCompletion: 68,
};

export const mockFormations = [
  {
    id: "6",
    titre: "Intelligence Artificielle pour les Décideurs",
    domaine: "Technologie",
    niveau: "Intermédiaire",
    prix: 450,
    stagiaires: 450,
    note: 4.9,
    noteTrend: "+0.2",
    duree: "20h",
    statut: "En cours",
    dateCreation: "2024-01-15",
    dateMiseAJour: "2024-04-28",
    tendanceStagiaires: "+15%",
    isTrending: true, // New: Tendance haussière
    healthScore: 92, // New: Health Score (0-100)
    sparklineData: [30, 40, 35, 50, 49, 60, 70],
    progressionMoyenne: 82,
    placesTotales: 500,
    prochaineSession: {
      date: "2024-05-10",
      heure: "09:00",
      lien: "https://zoom.us/j/123456789"
    },
    tags: ["Certifiant", "IA", "Premium"],
    engagement: "positif",
    revenus: "5.4K KDA",
    revenusVariation: "+15%",
    customGoal: { label: "Objectif: 500 inscrits", current: 450, target: 500 }, // New: Custom Goal
    alertes: { questions: 2, corrections: 5, decrochage: 3 },
    isPinned: true,
    popularite: true
  },
  {
    id: "2",
    titre: "Design Thinking & Innovation",
    domaine: "Design",
    niveau: "Débutant",
    prix: 200,
    stagiaires: 120,
    note: 4.7,
    noteTrend: "stable",
    duree: "15h",
    statut: "Complet",
    dateCreation: "2024-02-20",
    dateMiseAJour: "2024-05-01",
    tendanceStagiaires: "+5%",
    isTrending: false,
    healthScore: 78,
    sparklineData: [10, 15, 12, 18, 20, 15, 22],
    progressionMoyenne: 65,
    placesTotales: 120,
    prochaineSession: {
      date: "2024-05-12",
      heure: "14:00",
      lien: "https://zoom.us/j/987654321"
    },
    tags: ["Prioritaire", "Design"],
    engagement: "neutre",
    revenus: "2.1K KDA",
    revenusVariation: "+2%",
    customGoal: { label: "Note cible: 4.8", current: 4.7, target: 4.8 },
    alertes: { questions: 0, corrections: 0, decrochage: 1 }
  },
  {
    id: "3",
    titre: "Marketing Digital Avancé",
    domaine: "Marketing",
    niveau: "Avancé",
    prix: 600,
    stagiaires: 0,
    note: 0,
    noteTrend: "",
    duree: "30h",
    statut: "Brouillon",
    dateCreation: "2024-03-05",
    dateMiseAJour: "2024-05-04",
    derniereSauvegarde: "Il y a 2 heures",
    tendanceStagiaires: "0%",
    isTrending: false,
    healthScore: 45,
    sparklineData: [0, 0, 0, 0, 0, 0, 0],
    progressionMoyenne: 0,
    placesTotales: 300,
    prochaineSession: {
      date: "TBD",
      heure: "TBD",
      lien: "#"
    },
    tags: ["Nouveau"],
    engagement: "neutre",
    revenus: "0 KDA",
    revenusVariation: "0%",
    alertes: { questions: 0, corrections: 0, decrochage: 0 }
  }
];

export const mockIARecommendations = [
  { id: 1, titre: "Nouveau module Python pour Data Science", score: "98% Match" },
  { id: 2, titre: "Optimisation du taux de conversion", score: "85% Match" }
];

export const mockCalendarEvents = [
  { date: "10 Mai", title: "IA Session Live", time: "09:00" },
  { date: "12 Mai", title: "Design Workshop", time: "14:00" },
  { date: "15 Mai", title: "Q&A Marketing", time: "18:00" }
];
