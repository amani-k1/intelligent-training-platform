import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import './UserManagementPage.css';
import api from '../api/axios';
import { createUser } from '../services/userService';
const MOCK_USERS = [
  { id: 1, firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@email.com', role: 'Apprenant', status: 'Actif', joinedDate: '12/01/2024' },
  { id: 2, firstName: 'Sarah', lastName: 'Mansouri', email: 's.mansouri@brn.dz', role: 'Formateur', status: 'Actif', joinedDate: '05/11/2023' },
  { id: 3, firstName: 'Karim', lastName: 'Bensalem', email: 'k.bensalem@email.com', role: 'Apprenant', status: 'Suspendu', joinedDate: '20/02/2024' },
  { id: 4, firstName: 'Admin', lastName: 'BRN', email: 'admin@brn-smart.dz', role: 'Admin', status: 'Actif', joinedDate: '01/01/2023' },
  { id: 5, firstName: 'Lina', lastName: 'Hadjadj', email: 'lina.h@design.com', role: 'Formateur', status: 'Actif', joinedDate: '15/03/2024' },
  { id: 6, firstName: 'Ahmed', lastName: 'Ali', email: 'ahmed.ali@test.com', role: 'Apprenant', status: 'Actif', joinedDate: '10/04/2024' },
  { id: 7, firstName: 'Sofia', lastName: 'Zidane', email: 'sofia.z@edu.dz', role: 'Apprenant', status: 'Actif', joinedDate: '22/04/2024' },
];

const UserManagementPage = () => {
  const { t } = useTranslation();

  // State
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState("");
  const rowsPerPage = 5;
const loadUsers = async (e) => {
    setError(null);
    try {
      const response = await api.get('/auth/users');
      // Adapter la réponse selon votre API Laravel
      const usersData = response.data.data || response.data;
      setUsers(usersData);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Impossible de charger les utilisateurs. Veuillez réessayer.');
      // En cas d'erreur, on peut garder les données mockées en développement
      
    } finally {
    }
  };
  // Modals State
  const [showModal, setShowModal] = useState(null); // 'add', 'edit', 'consult'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', role: 'Apprenant', status: 'Actif', password: '' });
useEffect(() => {
  loadUsers();
}, []);
  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const fullName = `${u.firstName} ${u.lastName}`;
      const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'Tous' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'Tous' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedUsers.map(u => u.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Handlers
  const handleOpenModal = (type, user = null) => {
    setShowModal(type);
    if (user) {
      setSelectedUser(user);
      setFormData({ ...user, password: '' });
    } else {
      setFormData({ name: '', email: '', role: 'Apprenant', status: 'Actif', password: '' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(null);
    setSelectedUser(null);
  };

  const handleDelete = (id) => {
    if (window.confirm(t('common.confirm_delete_user'))) {
      setUsers(users.filter(u => u.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleStatusToggle = (id) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'Suspendu' ? 'Actif' : 'Suspendu' };
      }
      return u;
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (showModal === 'add') {
      const response = createUser(formData);
      const newUser = { ...formData, id: Date.now(), joinedDate: new Date().toLocaleDateString() };
      setUsers([newUser, ...users]);
    } else if (showModal === 'edit') {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
    }
    handleCloseModal();
  };

  return (
    <DashboardLayout role="admin">
      <div className="um-page animate-fade-in">

        <header className="um-header-v2">
          <h1>{t('common.user_management')}</h1>
          <div className="um-header-actions">
            <button className="um-btn-add-v2" onClick={() => handleOpenModal('add')}>{t('common.add_user')}</button>
            <button className={`um-btn-batch ${selectedIds.length > 0 ? 'active' : ''}`} disabled={selectedIds.length === 0}>{t('common.ban_selection')}</button>
            <button className={`um-btn-batch ${selectedIds.length > 0 ? 'active' : ''}`} disabled={selectedIds.length === 0}>{t('common.delete_selection')}</button>
          </div>
        </header>

        {/* ── TABLE ── */}
        <div className="um-table-container-v2">
          <table className="um-table-v2">
            <thead>
              <tr>
                <th className="um-col-check">
                  <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === paginatedUsers.length} />
                </th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(u => (
                <tr key={u.id} className={selectedIds.includes(u.id) ? 'selected' : ''}>
                  <td>
                    <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleSelect(u.id)} />
                  </td>
                  <td><strong>{u.name} </strong></td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <span className={`um-status-badge um-status--${u.status.toLowerCase()}`}>
                      {u.status === 'Actif' ? 'ACTIVE' : u.status === 'Suspendu' ? 'BANNED' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>{u.created_at}</td>
                  <td>
                    <div className="um-actions-v2">
                      <button className="um-action-btn edit" onClick={() => handleOpenModal('edit', u)}>{t('common.edit')}</button>
                      <button className="um-action-btn ban" onClick={() => handleStatusToggle(u.id)}>
                        {u.status === 'Suspendu' ? t('common.unban') : t('common.ban')}
                      </button>
                      <button className="um-action-btn delete" onClick={() => handleDelete(u.id)}>{t('common.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="um-empty">{t('common.no_user')}</div>
          )}
        </div>

        {/* ── PAGINATION ── */}
        <footer className="um-pagination">
          <span>Affichage de {paginatedUsers.length} sur {filteredUsers.length} utilisateurs</span>
          <div className="um-pagination-btns">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>&lt;</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} className={currentPage === i + 1 ? 'active' : ''} onClick={() => setCurrentPage(i + 1)}>
                {i + 1}
              </button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>&gt;</button>
          </div>
        </footer>

        {/* ── MODALS ── */}
        {(showModal === 'add' || showModal === 'edit') && (
          <div className="um-modal-overlay">
            <div className="um-modal-content animate-slide-up">
              <div className="um-modal-header">
                <h2>{showModal === 'add' ? t('common.add_user') : t('common.edit_user')}</h2>
                <button onClick={handleCloseModal}><i className="fas fa-times"></i></button>
              </div>
              <form onSubmit={handleSubmit} className="um-form">
                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>Nom</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                </div>
                <div className="um-form-group">
                  <label>Email</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="um-form-row">
                  <div className="um-form-group">
                    <label>Rôle</label>
                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                      <option>stagiaire</option>
                      <option>Formateur</option>
                      <option>Admin</option>
                    </select>
                  </div>
                  <div className="um-form-group">
                    <label>Statut</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option>Actif</option>
                      <option>Suspendu</option>
                    </select>
                  </div>
                </div>
                {showModal === 'add' && (
                  <div className="um-form-group">
                    <label>Mot de passe (optionnel)</label>
                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                )}
                <div className="um-modal-footer">
                  <button type="button" className="um-btn-cancel" onClick={handleCloseModal}>{t('common.cancel')}</button>
                  <button type="submit" className="um-btn-save">
                    {showModal === 'add' ? t('common.create') : t('common.save_changes')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showModal === 'consult' && selectedUser && (
          <div className="um-modal-overlay">
            <div className="um-modal-content um-modal--detail animate-slide-up">
              <div className="um-modal-header">
                <h2>{t('common.user_details')}</h2>
                <button onClick={handleCloseModal}><i className="fas fa-times"></i></button>
              </div>
              <div className="um-detail-body">
                <div className="um-detail-header">
                  <div className="um-detail-avatar">{selectedUser.name[0]}{selectedUser.prenom[0]}</div>
                  <div className="um-detail-name">
                    <h3>{selectedUser.name} {selectedUser.prenom}</h3>
                    <span className={`um-status-pill um-status--${selectedUser.status.toLowerCase()}`}>{selectedUser.status}</span>
                  </div>
                </div>
                <div className="um-detail-grid">
                  <div className="um-detail-item">
                    <label>Email</label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div className="um-detail-item">
                    <label>Rôle</label>
                    <p>{selectedUser.role}</p>
                  </div>
                  <div className="um-detail-item">
                    <label>Date d'inscription</label>
                    <p>{selectedUser.joinedDate}</p>
                  </div>
                  <div className="um-detail-item">
                    <label>ID Utilisateur</label>
                    <p>#{selectedUser.id}</p>
                  </div>
                </div>
              </div>
              <div className="um-modal-footer">
                <button className="um-btn-cancel" onClick={handleCloseModal}>{t('common.close')}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default UserManagementPage;
