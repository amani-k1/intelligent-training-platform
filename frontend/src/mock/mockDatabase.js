// frontend/src/mock/mockDatabase.js

const STORAGE_KEY = 'brn_smart_db';

const INITIAL_DATA = {
  users: [
    { id: 'u1', nom: 'Benali', prenom: 'Ahmed', email: 'ahmed@example.com', role: 'stagiaire', objectifs: ['IT', 'Management'] },
    { id: 'u2', nom: 'SARL Tech', prenom: 'Admin', email: 'contact@sarltech.dz', role: 'entreprise', secteur: 'Informatique' },
    { id: 'u3', nom: 'Mansouri', prenom: 'Karim', email: 'karim@brn.dz', role: 'formateur', specialite: 'Cloud & DevOps' }
  ],
  formations: [
    { id: 'f1', titre: 'Expert Cloud & AWS', domaine: 'IT', duree: '40h', niveau: 'avancé', prix: 45000, format: 'distanciel', places: 5, prerequis: 'Base Linux', formateurId: 'u3', formateurNom: 'Mansouri Karim', certification: 'AWS Certified' },
    { id: 'f2', titre: 'Management de Projet Agile', domaine: 'Management', duree: '24h', niveau: 'intermédiaire', prix: 32000, format: 'présentiel', places: 12, prerequis: 'Expérience pro', formateurId: 'u3', formateurNom: 'Mansouri Karim', certification: 'PMP/Scrum' },
    { id: 'f3', titre: 'Développement React/Node', domaine: 'IT', duree: '60h', niveau: 'débutant', prix: 38000, format: 'distanciel', places: 8, prerequis: 'HTML/CSS', formateurId: 'u3', formateurNom: 'Mansouri Karim', certification: 'Certificat BRN' }
  ],
  inscriptions: [
    { id: 'i1', userId: 'u1', formationId: 'f1', statut: 'validée', progression: 45, dateInscription: '2024-03-01' }
  ],
  demandes_devis: [],
  notifications: [
    { id: 'n1', userId: 'u1', message: 'Bienvenue sur votre espace stagiaire !', date: '2024-03-01', lue: false }
  ],
  guide: [
    { id: 'g1', keywords: ['profil', 'modifier', 'compte'], role: 'all', question: 'Comment modifier mon profil ?', answer: 'Allez dans votre Dashboard, cliquez sur l\'icône de profil en haut à droite, puis sur "Paramètres".' },
    { id: 'g2', keywords: ['certificat', 'diplôme', 'attestation'], role: 'all', question: 'Comment obtenir mon certificat ?', answer: 'Une fois la formation terminée à 100%, votre certificat sera généré automatiquement dans l\'onglet "Mes Certificats".' },
    {id: 'g3', keywords: ['payer', 'paiement', 'prix'], role: 'stagiaire', question: 'Comment payer ma formation ?', answer: 'Nous acceptons les virements bancaires, CCP ou le paiement par carte CIB/Edahabia.'},
    {id: 'g4', keywords: ['technique', 'aide', 'bug', 'problème'], role: 'all', question: 'Besoin d\'une aide technique ?', answer: 'Si vous rencontrez un problème technique, vous pouvez contacter notre support IT à support@brn.dz ou appeler le +213 23 XX XX XX.'},
    {id: 'g5', keywords: ['contact', 'adresse', 'siège'], role: 'all', question: 'Où nous trouver ?', answer: 'BRN SMART est situé à Alger, Sidi Yahia. Nous sommes ouverts du Dimanche au Jeudi, de 08:30 à 16:30.'}
  ]
};

class MockDatabase {
  constructor() {
    this.data = this.load();
  }

  load() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    this.save(INITIAL_DATA);
    return INITIAL_DATA;
  }

  save(data = this.data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    this.data = data;
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('brn_db_update'));
  }

  // --- Access Functions ---

  getUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  getFormations(domaine = null) {
    if (domaine) {
      return this.data.formations.filter(f => f.domaine.toLowerCase() === domaine.toLowerCase());
    }
    return this.data.formations;
  }

  getInscriptionsByUser(userId) {
    return this.data.inscriptions
      .filter(ins => ins.userId === userId)
      .map(ins => ({
        ...ins,
        formation: this.data.formations.find(f => f.id === ins.formationId)
      }));
  }

  inscrireUtilisateur(userId, formationId) {
    const formation = this.data.formations.find(f => f.id === formationId);
    if (!formation || formation.places <= 0) return { success: false, message: 'Plus de places disponibles.' };

    const dejaInscrit = this.data.inscriptions.find(i => i.userId === userId && i.formationId === formationId);
    if (dejaInscrit) return { success: false, message: 'Déjà inscrit à cette formation.' };

    const nouvelleInscription = {
      id: 'i' + Date.now(),
      userId,
      formationId,
      statut: 'en attente',
      progression: 0,
      dateInscription: new Date().toISOString().split('T')[0]
    };

    this.data.inscriptions.push(nouvelleInscription);
    formation.places -= 1;
    
    this.addNotification(userId, `Votre inscription à "${formation.titre}" est en cours de traitement.`);
    this.save();
    return { success: true, inscription: nouvelleInscription };
  }

  addDemandeDevis(entrepriseId, description) {
    const nouvelleDemande = {
      id: 'd' + Date.now(),
      entrepriseId,
      description,
      statut: 'en cours',
      createdAt: new Date().toISOString()
    };
    this.data.demandes_devis.push(nouvelleDemande);
    this.save();
    return { success: true, demande: nouvelleDemande };
  }

  getProgressionGlobal(userId) {
    const userIns = this.data.inscriptions.filter(i => i.userId === userId);
    if (userIns.length === 0) return 0;
    const total = userIns.reduce((acc, curr) => acc + curr.progression, 0);
    return Math.round(total / userIns.length);
  }

  getCandidatsPourFormateur(formateurId) {
    const myFormationsIds = this.data.formations
      .filter(f => f.formateurId === formateurId)
      .map(f => f.id);
    
    return this.data.inscriptions
      .filter(i => myFormationsIds.includes(i.formationId))
      .map(i => ({
        ...i,
        user: this.data.users.find(u => u.id === i.userId),
        formation: this.data.formations.find(f => f.id === i.formationId)
      }));
  }

  addNotification(userId, message) {
    this.data.notifications.unshift({
      id: 'n' + Date.now(),
      userId,
      message,
      date: new Date().toISOString(),
      lue: false
    });
    this.save();
  }

  chercherDansGuide(query, role) {
    const q = query.toLowerCase();
    return this.data.guide.filter(entry => {
      const matchRole = entry.role === 'all' || entry.role === role;
      const matchKeyword = entry.keywords.some(k => q.includes(k));
      return matchRole && matchKeyword;
    });
  }
}

export const mockDB = new MockDatabase();
