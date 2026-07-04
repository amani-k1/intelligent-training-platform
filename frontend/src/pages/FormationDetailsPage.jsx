import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import Navbar from '../components/Navbar';
import './FormationDetailsPage.css';
import { fetchFormationsDetaill } from '../services/Formationservice';
const FormationDetailsPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const [formation, setFormation] = useState([]);
  const [Loading, setLoading] = useState(false);
  // Mock data pour la démo (En attendant votre API réelle)
  useEffect(() => {
    /*const MOCK_DATA = {
      '1': {
        title: 'Développement Web Full-Stack',
        cat: 'Informatique',
        duration: '3 Mois',
        level: 'Intermédiaire',
        price: '45,000 DZD',
        desc: 'Devenez un expert du web capable de concevoir des applications complètes, du front-end au back-end. Maîtrisez React, Node.js et les bases de données modernes.',
        program: [
          'Fondamentaux HTML5 / CSS3 / JavaScript ES6',
          'Architecture React.js & Redux',
          'Back-end avec Node.js & Express',
          'Bases de données SQL & NoSQL (MongoDB)',
          'Déploiement et DevOps (Docker, CI/CD)'
        ],
        instructor: 'Dr. Sara Mansouri',
        image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
        color: '#0a8fa0'
      },
      '2': {
        title: 'Gestion de Projet Agile',
        cat: 'Management',
        duration: '6 Semaines',
        level: 'Tous niveaux',
        price: '30,000 DZD',
        desc: 'Apprenez les méthodologies Scrum et Kanban pour gérer vos projets avec agilité et efficacité dans un environnement professionnel dynamique.',
        program: [
          'Introduction au Manifeste Agile',
          'Rôles et Responsabilités Scrum',
          'Planification de Sprint & Backlog',
          'Outils de suivi (Jira, Trello)',
          'Simulation de projet réel'
        ],
        instructor: 'M. Karim Bensalem',
        image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
        color: '#27ae60'
      },
      '3': {
        title: 'UI/UX Design Professionnel',
        cat: 'Design',
        duration: '2 Mois',
        level: 'Débutant',
        price: '35,000 DZD',
        desc: 'Concevez des interfaces centrées sur l\'utilisateur. Apprenez le prototypage, la psychologie des couleurs et la création de parcours utilisateurs fluides.',
        program: [
          'Design Thinking & Recherche Utilisateur',
          'Wireframing & Architecture d\'information',
          'Maîtrise de Figma & Adobe XD',
          'Design System & Composants',
          'Tests Utilisateurs & Itération'
        ],
        instructor: 'Mme. Lina Hadjadj',
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
        color: '#9b59b6'
      }
    };*/
    const loadFormationDetaille = async () => {
      setLoading(true);
      
      try {
        const data = await fetchFormationsDetaill(id);
        const c = data;
        const mapped = {
         id: c.id,
         title: c.title,
         cat: c.domaine ?? '',
         duration: c.duree,
         students: c.places_totales ?? '—',
         desc: c.description ?? '—',
         price: c.prix,
         instructor: c.nom_formateur,
         level: c.niveau,
         program: Array.isArray(c.programme) ? c.programme : (c.program ?? []),
         image: c.image ?? 'https://images.unsplash.com/photo-1590283603385-18ff388834b5?w=500&q=80',
         color: c.couleur ?? '#ccc',
        };
        setFormation(mapped);
      } catch (error) {
          console.error('Erreur lors du chargement des détaills de formations:', error);
      } finally {
          setLoading(false);
      }
    }
    loadFormationDetaille();
    window.scrollTo(0, 0);
  }, []);

  if (Loading) return <div className="loading">{t('formation_details_page.loading')}</div>;

  return (
    <div className="details-page">
      <Navbar />

      {/* ── HERO SECTION (AFFICHE) ── */}
      <section className="details-hero" style={{ '--accent': formation.color }}>
        <div className="details-hero__bg">
          {Loading?".... " :<img src={formation.image} alt={formation.title} />}
          <div className="details-hero__overlay"></div>
        </div>

        <div className="details-hero__content">
          {Loading?".... " :<span className="details-badge">{formation.cat}</span>}
          {Loading?".... " :<h1>{formation.title}</h1>}
          <p className="details-desc">{formation.desc}</p>

          <div className="details-meta-grid">
            <div className="details-meta-item">
              <div>
                <label>{t('formation_details_page.duration_label')}</label>
                {Loading ? ".... " : <strong>{formation.duration} h</strong>}
              </div>
            </div>
            <div className="details-meta-item">
              <div>
                <label>{t('formation_details_page.level_label')}</label>
                {Loading ? "...." : <strong>{formation.level}</strong>}
              </div>
            </div>
            <div className="details-meta-item">
              <div>
                <label>{t('formation_details_page.trainer_label')}</label>
                {Loading ? "..." : <strong>{formation.instructor}</strong>}
              </div>
            </div>
          </div>

          <div className="details-actions">
            <Link to={`/formations/register/${id}`} className="btn-register">
              {t('formation_details_page.register_cta')} — {formation.price} TND
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTENT SECTION ── */}
      <section className="details-main">
        <div className="details-grid">

          {/* Programme */}
          <div className="details-card details-program">
            <h3>{t('formation_details_page.program_title')}</h3>
            {formation.program && formation.program.length > 0 ? (
              <ul>
                {formation.program.map((module, i) => (
                  <li key={i}>
                    <span className="program-step">{i + 1}</span>
                    <span>{typeof module === 'object' ? module.titre : module}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="program-empty">Programme en cours de préparation.</p>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="details-sidebar">
            <div className="details-card info-box">
              <h3>{t('formation_details_page.what_you_get')}</h3>
              <div className="info-item">✅ {t('formation_details_page.benefit1')}</div>
              <div className="info-item">✅ {t('formation_details_page.benefit2')}</div>
              <div className="info-item">✅ {t('formation_details_page.benefit3')}</div>
              <div className="info-item">✅ {t('formation_details_page.benefit4')}</div>
            </div>

            <div className="details-card instructor-card">
              <h3>{t('formation_details_page.your_expert')}</h3>
              <div className="instructor-info">
                <div className="instructor-avatar"></div>
                <div>
                  <h4>{formation.instructor}</h4>
                  <p>{t('formation_details_page.senior_expert')}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FOOTER CALL TO ACTION ── */}
      <section className="details-cta-bottom">
        <h2>{t('formation_details_page.cta_title')}</h2>
        <p>{t('formation_details_page.cta_sub')}</p>
        <Link to={`/formations/register/${id}`} className="btn-register-footer">
          {t('formation_details_page.cta_btn')}
        </Link>
      </section>

    </div>
  );
};

export default FormationDetailsPage;
