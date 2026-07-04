// ─── MOCK DATA for TrainerMessagesPage ───────────────────────────────────────
export const FORMATIONS = [
  { id: 'f1', title: 'IA pour décideurs',  color: '#1B9B85' },
  { id: 'f2', title: 'Marketing Digital',  color: '#e67e22' },
  { id: 'f3', title: 'Développement Web',  color: '#3498db' },
];

export const DEFAULT_TEMPLATES = [
  { id: 't1', label: 'Accusé de réception',   text: 'Merci pour votre message, je vous réponds sous 24h.' },
  { id: 't2', label: 'Lien cours',             text: 'Voici le lien vers le cours : https://brn-smart.com/cours/...' },
  { id: 't3', label: 'Rappel session',         text: 'Session live demain à 10h00. Soyez présent(e) !' },
  { id: 't4', label: 'Devoir noté',            text: 'Votre devoir a été noté. Consultez vos résultats sur la plateforme.' },
];

const now = new Date();
const hm = (h, m = 0) => { const d = new Date(now); d.setHours(h, m, 0, 0); return d; };
const daysAgo = (n) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
const fmt = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

export const INITIAL_CONVERSATIONS = [
  {
    id: 1, formationId: 'f1', name: 'Yasmine Boulahia', initials: 'YB', color: '#9b59b6',
    online: true, archived: false, blocked: false,
    replied: false, // formateur n'a pas encore répondu au dernier msg
    messages: [
      { id: 1, self: false, text: 'Bonjour, quand est la prochaine session live ?',        time: fmt(hm(8,55)),  date: 'Aujourd\'hui', seen: true,  attachments: [] },
      { id: 2, self: true,  text: 'Bonjour Yasmine ! La prochaine session est jeudi à 10h.', time: fmt(hm(9,2)),   date: 'Aujourd\'hui', seen: true,  attachments: [] },
      { id: 3, self: false, text: 'Super merci ! Est-ce qu\'il y a du matériel à préparer ?', time: fmt(hm(9,10)), date: 'Aujourd\'hui', seen: true,  attachments: [] },
      { id: 4, self: false, text: 'Et le lien Zoom sera le même que d\'habitude ?',          time: fmt(hm(9,14)), date: 'Aujourd\'hui', seen: false, attachments: [] },
    ],
  },
  {
    id: 2, formationId: 'f2', name: 'Karim Ouali', initials: 'KO', color: '#e67e22',
    online: false, archived: false, blocked: false, replied: true,
    messages: [
      { id: 1, self: false, text: 'Bonjour, mon exercice SEO est-il correct ?',              time: '14:00', date: 'Hier', seen: true, attachments: [] },
      { id: 2, self: true,  text: 'Oui Karim, très bon travail ! Quelques points à améliorer sur les balises H2.', time: '14:30', date: 'Hier', seen: true, attachments: [{ name: 'correction_SEO.pdf', type: 'pdf' }] },
      { id: 3, self: false, text: 'Merci pour la correction !',                              time: '14:35', date: 'Hier', seen: true, attachments: [] },
    ],
  },
  {
    id: 3, formationId: 'f3', name: 'Amina Cherif', initials: 'AC', color: '#3498db',
    online: true, archived: false, blocked: false, replied: false, critical: true,
    messages: [
      { id: 1, self: false, text: 'Bonjour, j\'ai un problème avec mon environnement React.',  time: '07:45', date: 'Aujourd\'hui', seen: true,  attachments: [] },
      { id: 2, self: false, text: 'TypeError: Cannot read properties of undefined (reading \'map\')', time: '07:48', date: 'Aujourd\'hui', seen: false, attachments: [{ name: 'screenshot_error.png', type: 'image' }] },
    ],
  },
  {
    id: 4, formationId: 'f1', name: 'Reda Mansouri', initials: 'RM', color: '#c0392b',
    online: false, archived: false, blocked: false, replied: true,
    messages: [
      { id: 1, self: true,  text: 'Reda, vous avez manqué le module 2. Avez-vous pu le rattraper ?', time: '10:00', date: 'Lun.', seen: true, attachments: [] },
      { id: 2, self: false, text: 'Oui j\'ai regardé le replay, c\'était très clair.',              time: '11:00', date: 'Lun.', seen: true, attachments: [] },
    ],
  },
  {
    id: 5, formationId: 'f2', name: 'Sara Idrissi', initials: 'SI', color: '#16a085',
    online: false, archived: true, blocked: false, replied: true,
    messages: [
      { id: 1, self: false, text: 'Merci pour le cours sur le référencement local !', time: '09:00', date: 'Mar.', seen: true, attachments: [] },
      { id: 2, self: true,  text: 'Avec plaisir Sara, n\'hésitez pas si vous avez des questions.', time: '09:30', date: 'Mar.', seen: true, attachments: [] },
    ],
  },
];
