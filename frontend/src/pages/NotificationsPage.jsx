import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import notificationService from '../services/notificationService';
import './NotificationsPage.css';

const NotificationsPage = ({ userRole = 'stagiaire' }) => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [view, setView] = useState('active'); // 'active' or 'archived'
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les notifications au montage et quand la vue change
  useEffect(() => {
    fetchNotifications();
  }, [view]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (view === 'active') {
        data = await notificationService.getAllNotifications();
      } else {
        data = await notificationService.getArchivedNotifications();
      }
      
      // Mapper les données du backend
      const mappedNotifications = Array.isArray(data) 
        ? data.map(mapBackendToFrontend)
        : Array.isArray(data?.data) 
          ? data.data.map(mapBackendToFrontend)
          : [];
      
      // Filtrer par rôle si nécessaire
      const filteredByRole = userRole 
        ? mappedNotifications.filter(n => n.role === userRole)
        : mappedNotifications;
      
      setNotifications(filteredByRole);
    } catch (err) {
      console.error('Erreur chargement notifications:', err);
      setError('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mapper les données du backend vers le format frontend
  const mapBackendToFrontend = (item) => {
    return {
      id: item.id,
      title: item.title || item.titre || '',
      message: item.message || item.contenu || '',
      date: item.created_at 
        ? new Date(item.created_at).toLocaleDateString('fr-FR') 
        : item.date || '',
      type: item.type || 'info',
      isRead: item.is_read || item.isRead || false,
      archived: item.archived || item.archived || false,
      role: item.role || item.user_role || 'stagiaire',
      user_id: item.user_id || null,
      link: item.link || null
    };
  };

  // Mapper le statut pour le backend
  const mapStatusToBackend = (notification) => {
    return {
      is_read: notification.isRead,
      archived: notification.archived
    };
  };

  const filteredNotifs = notifications;

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      if (selectedNotif?.id === id) {
        setSelectedNotif(prev => ({ ...prev, isRead: true }));
      }
    } catch (err) {
      console.error('Erreur marquage lecture:', err);
      alert('Erreur lors du marquage comme lu');
    }
  };

  const handleArchive = async (id) => {
    try {
      await notificationService.archiveNotification(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, archived: true } : n)
      );
    } catch (err) {
      console.error('Erreur archivage:', err);
      alert('Erreur lors de l\'archivage');
    }
  };

  const handleRestore = async (id) => {
    try {
      await notificationService.restoreNotification(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, archived: false } : n)
      );
    } catch (err) {
      console.error('Erreur restauration:', err);
      alert('Erreur lors de la restauration');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette notification définitivement ?')) {
      try {
        await notificationService.deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (selectedNotif?.id === id) {
          setSelectedNotif(null);
        }
      } catch (err) {
        console.error('Erreur suppression:', err);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleGeneratePDF = async (n) => {
    try {
      await notificationService.generatePDF(n.id);
    } catch (err) {
      console.error('Erreur génération PDF:', err);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('Erreur marquage global:', err);
      alert('Erreur lors du marquage global');
    }
  };

  return (
    <DashboardLayout role={userRole}>
      <div className="nt-page animate-fade-in">
        
        {/* Message d'erreur */}
        {error && (
          <div className="error-banner" style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
            <button 
              onClick={() => setError(null)} 
              style={{float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'}}
            >
              ×
            </button>
          </div>
        )}

        {/* Indicateur de chargement */}
        {loading && (
          <div style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
            <p>{t('common.loading')}</p>
          </div>
        )}

        <header className="nt-header">
          <div className="nt-header-left">
            <h1>{t('common.notifications_page_title')}</h1>
            <p>{t('common.notifications_page_sub')}</p>
          </div>
          <div className="nt-tabs">
            <button 
              className={view === 'active' ? 'active' : ''} 
              onClick={() => setView('active')}
            >
              {t('common.tab_active')}
              {notifications.filter(n => !n.isRead && !n.archived).length > 0 && (
                <span className="nt-badge-count">
                  {notifications.filter(n => !n.isRead && !n.archived).length}
                </span>
              )}
            </button>
            <button
              className={view === 'archived' ? 'active' : ''}
              onClick={() => setView('archived')}
            >
              {t('common.tab_archived')}
            </button>
          </div>
        </header>

        {/* Bouton "Tout marquer comme lu" */}
        {view === 'active' && notifications.some(n => !n.isRead) && (
          <div style={{marginBottom: '1rem', textAlign: 'right'}}>
            <button 
              onClick={handleMarkAllAsRead}
              style={{
                padding: '0.5rem 1rem',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {t('common.mark_all_read')}
            </button>
          </div>
        )}

        <div className="nt-list">
          {filteredNotifs.length === 0 ? (
            <div className="nt-empty">
               <i className="fas fa-bell-slash"></i>
               <p>{t('common.no_notification')}</p>
            </div>
          ) : (
            filteredNotifs.map(n => (
              <div key={n.id} className={`nt-card ${!n.isRead ? 'unread' : ''} nt-type--${n.type}`}>
                <div className="nt-card-icon">
                  <i className={`fas ${
                    n.type === 'success' ? 'fa-check-circle' : 
                    n.type === 'warning' ? 'fa-exclamation-triangle' : 
                    n.type === 'error' ? 'fa-times-circle' :
                    'fa-info-circle'
                  }`}></i>
                </div>
                <div className="nt-card-content">
                  <div className="nt-card-header">
                    <h3>
                      {!n.isRead && <span className="nt-unread-dot">●</span>}
                      {n.title}
                    </h3>
                    <span className="nt-date">{n.date}</span>
                  </div>
                  <p>{n.message}</p>
                  <div className="nt-card-actions">
                    <button onClick={() => { setSelectedNotif(n); handleMarkAsRead(n.id); }}>
                      {t('common.details')}
                    </button>
                    {!n.isRead && (
                      <button onClick={() => handleMarkAsRead(n.id)}>
                        {t('common.mark_read')}
                      </button>
                    )}
                    {view === 'active' ? (
                      <button onClick={() => handleArchive(n.id)}>{t('common.archive')}</button>
                    ) : (
                      <button onClick={() => handleRestore(n.id)}>{t('common.restore')}</button>
                    )}
                    <button className="nt-btn-danger" onClick={() => handleDelete(n.id)}>
                      {t('common.delete')}
                    </button>
                    {(userRole === 'formateur' || userRole === 'admin') && (
                      <button className="nt-btn-pdf" onClick={() => handleGeneratePDF(n)}>
                        <i className="fas fa-file-pdf"></i> PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Détails */}
        {selectedNotif && (
          <div className="nt-modal-overlay" onClick={() => setSelectedNotif(null)}>
            <div className="nt-modal-content" onClick={e => e.stopPropagation()}>
              <div className="nt-modal-header">
                <h2>{selectedNotif.title}</h2>
                <button onClick={() => setSelectedNotif(null)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="nt-modal-body">
                 <p className="nt-modal-date">
                   {t('common.received_on')} {selectedNotif.date}
                   {selectedNotif.isRead ? ` ✓ (${t('common.read_label')})` : ` • (${t('common.unread_label')})`}
                 </p>
                 <div className="nt-modal-message">
                   {selectedNotif.message}
                 </div>
                 {selectedNotif.link && (
                   <a href={selectedNotif.link} className="nt-modal-link">
                     {t('common.see_more_details')} →
                   </a>
                 )}
              </div>
              <div className="nt-modal-footer">
                {(userRole === 'formateur' || userRole === 'admin') && (
                   <button className="nt-btn-pdf" onClick={() => handleGeneratePDF(selectedNotif)}>
                     <i className="fas fa-file-pdf"></i> {t('common.generate_pdf')}
                   </button>
                )}
                <button className="nt-btn-close" onClick={() => setSelectedNotif(null)}>
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;