import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const DOMAINES = [
  { id: 'tous',         label: 'Tous les domaines'   },
  { id: 'Informatique', label: 'Informatique & Tech' },
  { id: 'Finance',      label: 'Finance'             },
  { id: 'Management',   label: 'Management'          },
  { id: 'Marketing',    label: 'Marketing'           },
  { id: 'Data Science', label: 'Data Science'        },
  { id: 'Soft Skills',  label: 'Soft Skills'         },
  { id: 'Langues',      label: 'Langues'             },
];

export default function NosFormateursPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formateurs, setFormateurs]     = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);

  const domaine = searchParams.get('domaine') || 'tous';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = domaine === 'tous'
          ? '/auth/formateurs-publics'
          : `/auth/formateurs-publics/${encodeURIComponent(domaine)}`;
        const res = await api.get(url);
        setFormateurs(Array.isArray(res.data) ? res.data : []);
      } catch {
        setError('Impossible de charger les formateurs.');
        setFormateurs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [domaine]);

  const selectDomaine = (d) => {
    if (d === 'tous') setSearchParams({});
    else setSearchParams({ domaine: d });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const domaineLabel = DOMAINES.find(d => d.id === domaine)?.label || 'Tous les domaines';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)', fontFamily: "'Nunito', sans-serif" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #0a8fa0 0%, #065f6b 100%)',
        padding: '7rem 3rem 4rem',
        textAlign: 'center',
        color: 'white',
      }}>
        <h1 style={{ fontFamily: "'Raleway', sans-serif", fontSize: '2.6rem', fontWeight: 900, margin: '0 0 0.75rem' }}>
          Nos Formateurs
        </h1>
        <p style={{ fontSize: '1.1rem', opacity: 0.88, maxWidth: '560px', margin: '0 auto' }}>
          Découvrez nos experts certifiés par domaine de spécialisation
        </p>
      </section>

      {/* ── Filtres domaines ── */}
      <section style={{ background: 'white', padding: '1.25rem 2rem', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 72, zIndex: 100 }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1100px', margin: '0 auto' }}>
          {DOMAINES.map(d => (
            <button
              key={d.id}
              onClick={() => selectDomaine(d.id)}
              style={{
                padding: '0.5rem 1.2rem',
                borderRadius: '24px',
                border: domaine === d.id ? '2px solid #0a8fa0' : '2px solid #e5e7eb',
                background: domaine === d.id ? '#0a8fa0' : 'white',
                color: domaine === d.id ? 'white' : '#374151',
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Contenu ── */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Titre section */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: '1.35rem', color: '#1e293b', margin: 0 }}>
            {domaineLabel}
          </h2>
          {!loading && (
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
              {formateurs.length} formateur{formateurs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* États */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 16, padding: '1.5rem', height: 220,
                animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <p style={{ fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {!loading && !error && formateurs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#64748b' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>👤</div>
            <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
              Aucun formateur disponible
            </h3>
            <p style={{ fontSize: '0.95rem' }}>
              Aucun formateur actif dans ce domaine pour le moment.
            </p>
          </div>
        )}

        {!loading && !error && formateurs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
            {formateurs.map(f => <FormateurCard key={f.id} formateur={f} />)}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { background: #f1f5f9; }
          50%       { background: #e2e8f0; }
        }
      `}</style>
    </div>
  );
}

function FormateurCard({ formateur }) {
  const [hovered, setHovered] = useState(false);
  const initials = [formateur.prenom, formateur.name]
    .filter(Boolean)
    .map(s => s.charAt(0))
    .join('')
    .toUpperCase() || '?';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        borderRadius: 16,
        padding: '1.5rem',
        boxShadow: hovered
          ? '0 12px 35px rgba(10,143,160,0.18)'
          : '0 2px 12px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-5px)' : 'none',
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* En-tête: avatar + nom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        {formateur.profile_picture ? (
          <img
            src={formateur.profile_picture}
            alt={formateur.name}
            style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #0a8fa0, #065f6b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '1.15rem',
            fontFamily: "'Raleway', sans-serif",
          }}>
            {initials}
          </div>
        )}
        <div>
          <h3 style={{ margin: 0, fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>
            {formateur.prenom} {formateur.name}
          </h3>
          {formateur.ville && (
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>📍 {formateur.ville}</span>
          )}
        </div>
      </div>

      {/* Badges domaine + spécialité */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {formateur.domaine && (
          <span style={{
            padding: '0.22rem 0.7rem',
            background: 'rgba(10,143,160,0.1)',
            color: '#0a8fa0',
            borderRadius: 10,
            fontSize: '0.76rem',
            fontWeight: 700,
          }}>
            {formateur.domaine}
          </span>
        )}
        {formateur.specialite && (
          <span style={{
            padding: '0.22rem 0.7rem',
            background: '#f1f5f9',
            color: '#475569',
            borderRadius: 10,
            fontSize: '0.76rem',
            fontWeight: 600,
          }}>
            {formateur.specialite}
          </span>
        )}
      </div>

      {/* Bio */}
      {formateur.bio && (
        <p style={{
          margin: 0,
          fontSize: '0.84rem',
          color: '#64748b',
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {formateur.bio}
        </p>
      )}

      {/* Expérience */}
      {formateur.annees_experience && (
        <div style={{
          marginTop: 'auto',
          paddingTop: '0.75rem',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.82rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
        }}>
          <span style={{ color: '#f59e0b' }}>⭐</span>
          <strong style={{ color: '#1e293b' }}>{formateur.annees_experience} ans</strong> d'expérience
        </div>
      )}
    </div>
  );
}
