import React, { useState } from 'react';
import { useTranslation } from './context/LanguageContext';
import axios from 'axios';

const RechercheFormation = () => {
  const { t } = useTranslation();
  const [recherche, setRecherche] = useState('');
  const [resultat, setResultat] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recherche.trim()) return;

    setChargement(true);
    setErreur('');
    setResultat(null);

    try {
      const response = await axios.post('/api/rechercher', { recherche });
      setResultat(response.data);
    } catch (err) {
      setErreur(t('recherche.error_unavailable'));
      console.error(err);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1rem', fontFamily: 'Arial' }}>
      <h2>{t('recherche.title')}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t('recherche.placeholder')}
          style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
        />
        <button type="submit" disabled={chargement} style={{ padding: '8px 16px' }}>
          {chargement ? t('recherche.searching') : t('recherche.search_btn')}
        </button>
      </form>

      {erreur && <p style={{ color: 'red' }}>{erreur}</p>}

      {resultat && (
        <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '12px', borderRadius: '8px' }}>
          <p><strong>{t('recherche.result_query')} :</strong> {resultat.requete}</p>
          <p><strong>{t('recherche.result_found')}</strong> {resultat.existe ? '✅ Oui' : '❌ Non'}</p>
          <p><strong>{t('recherche.result_closest')} :</strong> {resultat.formation_proche}</p>
          <p><strong>{t('recherche.result_similarity')} :</strong> {(resultat.similarite * 100).toFixed(2)}%</p>
          {!resultat.existe && (
            <p style={{ color: 'orange' }}>
              {t('recherche.result_not_exist')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RechercheFormation;
