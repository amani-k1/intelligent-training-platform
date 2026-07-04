// src/pages/Trainer/MesFormations/types.js
// Reference types for the JS project

export const Status = ['Toutes', 'En cours', 'Brouillon', 'Archivées'];
export const Levels = ['Débutant', 'Intermédiaire', 'Avancé'];

/* 
Formation structure:
{
  id: string,
  titre: string,
  domaine: string,
  niveau: string, // Débutant, Intermédiaire, Avancé
  prix: number,
  stagiaires: number,
  note: number,
  noteTrend: string, // "+0.2"
  duree: string,
  statut: string, // En cours, Brouillon, Archivées, Complet, Promo
  dateCreation: string,
  dateMiseAJour: string,
  derniereSauvegarde: string, // for drafts
  tendanceStagiaires: string, // "+12%"
  sparklineData: number[],
  progressionMoyenne: number,
  placesTotales: number,
  prochaineSession: { date, heure, lien },
  tags: string[], // ["Certifiant", "Prioritaire"]
  engagement: string, // positif, neutre, negatif
  revenus: string,
  revenusVariation: string, // "+5%"
  feedbacksRecents: number[],
  alertes: {
    questions: number,
    corrections: number,
    decrochage: number // number of students < 20%
  },
  isPinned: boolean,
  popularite: boolean
}
*/
