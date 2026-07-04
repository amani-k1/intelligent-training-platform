// src/pages/Trainer/MesFormations/components/Modals.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../../context/LanguageContext';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  createFormation,
  updateFormation,
  deleteFormation,
  fetchCandidats,
} from '../../../../services/Formationservice';

/* ═══════════════════════════════════════
   Modal de base (inchangé)
═══════════════════════════════════════ */
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center p-6 border-b border-slate-50 dark:border-slate-700/50">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <XMarkIcon className="h-6 w-6 text-slate-400" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   FormationFormModal — CREATE / UPDATE
   POST /app/formations
   PUT  /app/formations/{id}
═══════════════════════════════════════ */
const EMPTY_FORM = {
  title: '', description: '', domaine: 'Technologie',
  niveau: 'Débutant', duree: '', prix: '', places_totales: '',
  statut: 'Brouillon', date_debut: '', date_fin: '',
};

export const FormationFormModal = ({ isOpen, onClose, formation, onSaved }) => {
  const { t } = useTranslation();
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (formation) {
      setForm({
        title:          formation.titre     || formation.title         || '',
        description:    formation.description                          || '',
        domaine:        formation.domaine                              || 'Technologie',
        niveau:         formation.niveau                               || 'Débutant',
        duree:          formation.duree     ? String(formation.duree)  : '',
        prix:           formation.prix      ? String(formation.prix)   : '',
        places_totales: formation.places_totales ? String(formation.places_totales) : '',
        statut:         formation.statut                               || 'Brouillon',
        date_debut:     formation.date_debut                          || '',
        date_fin:       formation.date_fin                            || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [formation, isOpen]);

  const handle = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim())         { setError('Le titre est obligatoire.');      return; }
    if (!form.description.trim())   { setError('La description est obligatoire.'); return; }
    if (!form.duree)                { setError('La durée est obligatoire.');       return; }
    if (!form.prix)                 { setError('Le prix est obligatoire.');        return; }
    if (!form.places_totales)       { setError('Les places sont obligatoires.');   return; }
    if (!form.date_debut)           { setError('La date de début est obligatoire.'); return; }
    if (form.date_fin && form.date_fin < form.date_debut) {
      setError('La date de fin doit être après la date de début.'); return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        duree:          parseInt(form.duree,          10),
        prix:           parseFloat(form.prix),
        places_totales: parseInt(form.places_totales, 10),
      };
      const result = formation?.id
        ? await updateFormation(formation.id, payload)
        : await createFormation(payload);
      onSaved?.(result);
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join(' ')
        : err.response?.data?.message ?? 'Erreur lors de la sauvegarde.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none dark:text-white';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={formation ? t('common.edit_formation') : t('common.new_formation')}>
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}
      <form className="space-y-4" onSubmit={e => e.preventDefault()}>

        {/* Titre */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('common.formation')} *</label>
          <input type="text" name="title" value={form.title} onChange={handle}
            className={inp} placeholder="Ex: Masterclass React Avancé" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description *</label>
          <textarea name="description" value={form.description} onChange={handle} rows={3}
            className={inp} placeholder="Décrivez le contenu de la formation…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Domaine */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Domaine</label>
            <select name="domaine" value={form.domaine} onChange={handle} className={inp}>
              {['Technologie','Design','Marketing','Soft Skills','Management','Finance','Langues'].map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Niveau */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('common.level')}</label>
            <select name="niveau" value={form.niveau} onChange={handle} className={inp}>
              <option>Débutant</option>
              <option>Intermédiaire</option>
              <option>Avancé</option>
            </select>
          </div>

          {/* Durée */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Durée (heures) *</label>
            <input type="number" name="duree" value={form.duree} onChange={handle} min="1"
              className={inp} placeholder="Ex: 20" />
          </div>

          {/* Prix */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prix (DZD) *</label>
            <input type="number" name="prix" value={form.prix} onChange={handle} min="0" step="0.01"
              className={inp} placeholder="Ex: 5000" />
          </div>

          {/* Places */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Places totales *</label>
            <input type="number" name="places_totales" value={form.places_totales} onChange={handle} min="1"
              className={inp} placeholder="Ex: 30" />
          </div>

          {/* Statut */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('common.status')}</label>
            <select name="statut" value={form.statut} onChange={handle} className={inp}>
              <option>Brouillon</option>
              <option>En cours</option>
              <option>Complet</option>
              <option>Fermée</option>
            </select>
          </div>

          {/* Date de début */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Date de début <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date_debut"
              value={form.date_debut}
              onChange={handle}
              className={inp}
            />
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Date de fin <span className="text-slate-400">(optionnel)</span>
            </label>
            <input
              type="date"
              name="date_fin"
              value={form.date_fin}
              onChange={handle}
              min={form.date_debut || undefined}
              className={inp}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            {t('common.cancel')}
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="px-6 py-3 text-sm font-bold bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition-colors disabled:opacity-60">
            {saving ? t('common.saving') : formation ? t('common.save') : t('common.create_formation')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

/* ═══════════════════════════════════════
   CandidatsDrawer
   GET /app/formations/{id}/candidats
═══════════════════════════════════════ */
export const CandidatsDrawer = ({ isOpen, onClose, formationId }) => {
  const { t } = useTranslation();
  // ── State candidats ──
  const [candidats, setCandidats] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  // Charger les candidats à l'ouverture du drawer
  useEffect(() => {
    if (!isOpen || !formationId) return;
    setLoading(true);
    setError('');
    fetchCandidats(formationId)
      .then(data => setCandidats(data))
      .catch(err => {
        setError(err.response?.data?.message ?? 'Impossible de charger les candidats.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, formationId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="absolute inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-800 shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold dark:text-white">
            {t('common.candidates_list')}
            {!loading && candidats.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">({candidats.length})</span>
            )}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
            <XMarkIcon className="h-6 w-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Chargement */}
          {loading && (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
               {t('common.loading_candidates')}
            </div>
          )}

          {/* Erreur */}
          {!loading && error && (
            <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}

          {/* Aucun candidat */}
          {!loading && !error && candidats.length === 0 && (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              {t('common.no_candidate')}
            </div>
          )}

          {/* Liste des candidats — données réelles */}
          {!loading && !error && candidats.length > 0 && (
            <div className="space-y-4">
              {candidats.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center space-x-3">
                    <img src={c.avatar} className="h-10 w-10 rounded-full" alt="" />
                    <div>
                      <p className="text-sm font-bold dark:text-white">{c.prenom} {c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.email}</p>
                      <p className="text-[10px] text-slate-400">Inscrit le {c.dateInscription}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   ConfirmModal — DELETE
   DELETE /app/formations/{id}
═══════════════════════════════════════ */
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, formationId, onDeleted }) => {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState('');

  // ── Suppression → DELETE /app/formations/{id} ──
  const handleConfirm = async () => {
    // Si onConfirm est fourni par le parent, on l'utilise directement
    if (onConfirm) { onConfirm(); return; }
    if (!formationId) return;
    setDeleting(true);
    setError('');
    try {
      await deleteFormation(formationId);
      onDeleted?.(formationId);  // remonte l'id supprimé au parent
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center py-4">
        <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-4">{message}</p>

        {/* Erreur suppression */}
        {error && (
          <p className="text-sm text-red-500 mb-4">⚠️ {error}</p>
        )}

        <div className="flex justify-center space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="px-6 py-3 text-sm font-bold bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? t('common.deleting') : t('common.confirm')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

