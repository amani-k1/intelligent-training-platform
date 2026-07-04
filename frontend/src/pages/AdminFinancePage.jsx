import React, { useState, useMemo } from 'react';
import { useTranslation } from '../context/LanguageContext';
import DashboardLayout from '../components/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AdminFinancePage.css';

// ── MOCK DATA ──
const DATA_SETS = {
  '1M': [
    { day: '01', amount: 1200 }, { day: '05', amount: 2400 }, { day: '10', amount: 1800 },
    { day: '15', amount: 3500 }, { day: '20', amount: 2800 }, { day: '25', amount: 4200 }, { day: '30', amount: 5100 }
  ],
  '6M': [
    { month: 'Jan', amount: 10200 }, { month: 'Fév', amount: 11400 }, { month: 'Mar', amount: 12800 },
    { month: 'Avr', amount: 13200 }, { month: 'Mai', amount: 14500 }, { month: 'Juin', amount: 15600 }
  ],
  '1Y': [
    { month: 'J', amount: 65000 }, { month: 'F', amount: 68000 }, { month: 'M', amount: 72000 },
    { month: 'A', amount: 75000 }, { month: 'M', amount: 80000 }, { month: 'J', amount: 84500 },
    { month: 'J', amount: 88000 }, { month: 'A', amount: 92000 }, { month: 'S', amount: 95000 },
    { month: 'O', amount: 98000 }, { month: 'N', amount: 102000 }, { month: 'D', amount: 110000 }
  ]
};

const SPARK_DATA = [
  { v: 10 }, { v: 22 }, { v: 18 }, { v: 35 }, { v: 28 }, { v: 45 }, { v: 42 }
];

const RECENT_TRANSACTIONS = [
  { id: 'TX-2024-001', date: '15/05/2024', formation: 'Développement Web Fullstack', user: 'Jean Dupont', amount: 1200, status: 'Payé' },
  { id: 'TX-2024-002', date: '14/05/2024', formation: 'UI/UX Design Masterclass', user: 'Sarah Mansouri', amount: 850, status: 'Payé' },
  { id: 'TX-2024-003', date: '14/05/2024', formation: 'Data Science & Python', user: 'Karim Bensalem', amount: 1500, status: 'Impayé' },
  { id: 'TX-2024-004', date: '13/05/2024', formation: 'Marketing Digital 360', user: 'Lina Hadjadj', amount: 750, status: 'En attente' },
  { id: 'TX-2024-005', date: '12/05/2024', formation: 'Gestion de Projet Agile', user: 'Ahmed Ali', amount: 900, status: 'Payé' },
];

const CLIENTS_FINANCE = [
  { id: 1, name: 'Jean Dupont', totalPaid: 2400, remaining: 0, formationsCount: 2, email: 'jean.dupont@email.com', joined: '12/01/2024' },
  { id: 2, name: 'Sarah Mansouri', totalPaid: 1700, remaining: 850, formationsCount: 3, email: 's.mansouri@brn.dz', joined: '05/11/2023' },
  { id: 3, name: 'Karim Bensalem', totalPaid: 0, remaining: 1500, formationsCount: 1, email: 'k.bensalem@email.com', joined: '20/02/2024' },
];

const TRAINERS_FINANCE = [
  { id: 1, name: 'Pr. Ahmed Ammar', totalEarned: 12500, pending: 3200, paid: 9300, studentsCount: 45, formationsCount: 4 },
  { id: 2, name: 'Mme. Sofia Ben', totalEarned: 8800, pending: 1400, paid: 7400, studentsCount: 22, formationsCount: 2 },
];

const AdminFinancePage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('global');
  const [timeframe, setTimeframe] = useState('6M');
  const [selectedItem, setSelectedItem] = useState(null);

  const stats = useMemo(() => ({
    total: 84500,
    pending: 12200,
    archived: 18300,
    evolution: '+8.2%'
  }), []);

  const handleOpenDetail = (item) => setSelectedItem(item);
  const handleCloseDetail = () => setSelectedItem(null);

  return (
    <DashboardLayout role="admin">
      <div className="af-v2 animate-fade-in">
        
        <header className="af-v2-header">
            <div className="af-v2-header__info">
            <h1>{t('common.finance_title')}</h1>
            <p>{t('common.finance_subtitle')}</p>
          </div>
          <button className="af-v2-btn-pdf-global" onClick={() => alert('PDF...')}>
            <i className="fas fa-file-pdf"></i> {t('common.global_pdf_report')}
          </button>
        </header>

        <nav className="af-v2-tabs">
          <button className={activeTab === 'global' ? 'active' : ''} onClick={() => setActiveTab('global')}>
            <i className="fas fa-chart-line"></i> {t('common.tab_performance')}
          </button>
          <button className={activeTab === 'clients' ? 'active' : ''} onClick={() => setActiveTab('clients')}>
            <i className="fas fa-user-graduate"></i> {t('common.tab_clients')}
          </button>
          <button className={activeTab === 'trainers' ? 'active' : ''} onClick={() => setActiveTab('trainers')}>
            <i className="fas fa-chalkboard-teacher"></i> {t('common.tab_trainers')}
          </button>
        </nav>

        <div className="af-v2-content">
          {activeTab === 'global' && <GlobalView stats={stats} timeframe={timeframe} setTimeframe={setTimeframe} />}
          {activeTab === 'clients' && <ClientsView onOpenDetail={handleOpenDetail} />}
          {activeTab === 'trainers' && <TrainersView onOpenDetail={handleOpenDetail} />}
        </div>

        {selectedItem && activeTab === 'clients' && <ClientDetailModal client={selectedItem} onClose={handleCloseDetail} />}
        {selectedItem && activeTab === 'trainers' && <TrainerDetailModal trainer={selectedItem} onClose={handleCloseDetail} />}
      </div>
    </DashboardLayout>
  );
};

const Sparkline = ({ color }) => (
  <div className="af-v2-sparkline">
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={SPARK_DATA}>
        <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const GlobalView = ({ stats, timeframe, setTimeframe }) => {
  const { t } = useTranslation();
  return (
  <div className="af-v2-global">
    <div className="af-v2-kpi-grid">
      <div className="af-v2-kpi-card blue">
        <div className="af-v2-kpi-top">
          <div className="af-v2-kpi-icon"><i className="fas fa-wallet"></i></div>
          <div className="af-v2-kpi-info">
            <span>{t('common.total_collected')}</span>
            <h3>{stats.total.toLocaleString()} DT</h3>
          </div>
        </div>
        <div className="af-v2-kpi-bottom">
          <p className="evolution success"><i className="fas fa-caret-up"></i> {stats.evolution}</p>
          <Sparkline color="#3498db" />
        </div>
      </div>

      <div className="af-v2-kpi-card orange">
        <div className="af-v2-kpi-top">
          <div className="af-v2-kpi-icon"><i className="fas fa-clock-rotate-left"></i></div>
          <div className="af-v2-kpi-info">
            <span>{t('common.pending')}</span>
            <h3>{stats.pending.toLocaleString()} DT</h3>
          </div>
        </div>
        <div className="af-v2-kpi-bottom">
          <p className="evolution warning"><i className="fas fa-exclamation-circle"></i> {t('common.pending_invoices')}</p>
          <Sparkline color="#f59e0b" />
        </div>
      </div>

      <div className="af-v2-kpi-card grey">
        <div className="af-v2-kpi-top">
          <div className="af-v2-kpi-icon"><i className="fas fa-box-archive"></i></div>
          <div className="af-v2-kpi-info">
            <span>{t('common.archived_label')}</span>
            <h3>{stats.archived.toLocaleString()} DT</h3>
          </div>
        </div>
        <div className="af-v2-kpi-bottom">
          <p className="evolution"><i className="fas fa-archive"></i> 23 transactions</p>
          <Sparkline color="#94a3b8" />
        </div>
      </div>
    </div>

    <div className="af-v2-row">
      <div className="af-v2-chart-box">
        <div className="af-v2-box-header">
          <h3>{t('common.monthly_revenue')}</h3>
          <div className="af-v2-timeframes">
            {['1M', '6M', '1Y'].map(tf => (
              <button key={tf} className={timeframe === tf ? 'active' : ''} onClick={() => setTimeframe(tf)}>{tf}</button>
            ))}
          </div>
        </div>
        <div className="af-v2-chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={DATA_SETS[timeframe]}>
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3498db" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3498db" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey={timeframe === '1M' ? 'day' : 'month'} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
              <Tooltip 
                cursor={{stroke: '#3498db', strokeWidth: 1, strokeDasharray: '5 5'}}
                formatter={(val) => [`${val.toLocaleString()} DT`, t('common.amount_col')]}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px'}}
              />
              <Area type="monotone" dataKey="amount" stroke="#3498db" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="af-v2-recent-box">
        <div className="af-v2-box-header">
          <h3>{t('common.recent_transactions')}</h3>
        </div>
        <table className="af-v2-recent-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>{t('common.user_formation_col')}</th>
              <th>{t('common.amount_col')}</th>
              <th>{t('common.status')}</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_TRANSACTIONS.map(tx => (
              <tr key={tx.id}>
                <td>{tx.date}</td>
                <td>
                  <div className="tx-ref">
                    <strong>{tx.user}</strong>
                    <span>{tx.formation}</span>
                  </div>
                </td>
                <td><strong>{tx.amount.toLocaleString()} DT</strong></td>
                <td>
                   <span className={`af-v2-status-tag ${tx.status.toLowerCase().replace(' ', '-')}`}>{tx.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};

const ClientsView = ({ onOpenDetail }) => {
  const { t } = useTranslation();
  return (
  <div className="af-v2-table-box">
    <table className="af-v2-full-table">
      <thead>
        <tr>
          <th>{t('common.client_name')}</th>
          <th>{t('common.total_paid')}</th>
          <th>{t('common.remaining_to_pay')}</th>
          <th>{t('common.formations')}</th>
          <th>{t('common.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {CLIENTS_FINANCE.map(c => (
          <tr key={c.id}>
            <td>
              <div className="af-v2-user-cell">
                <div className="af-v2-avatar">{c.name[0]}</div>
                <div>
                  <strong>{c.name}</strong>
                  <p>{c.email}</p>
                </div>
              </div>
            </td>
            <td><strong className="text-success">{c.totalPaid} DT</strong></td>
            <td><strong className="text-danger">{c.remaining} DT</strong></td>
            <td><span className="af-v2-count-badge">{c.formationsCount} {t('common.formations')}</span></td>
            <td>
              <div className="af-v2-actions-group">
                <button className="af-v2-action-text consult" onClick={() => onOpenDetail(c)}>{t('common.view')}</button>
                <button className="af-v2-action-text archive" onClick={() => alert('Archivage...')}>{t('common.archive')}</button>
                <button className="af-v2-action-text delete" onClick={() => alert('Suppression...')}>{t('common.delete')}</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  );
};

const TrainersView = ({ onOpenDetail }) => {
  const { t } = useTranslation();
  return (
  <div className="af-v2-table-box">
    <table className="af-v2-full-table">
      <thead>
        <tr>
          <th>{t('common.trainer')}</th>
          <th>{t('common.total_earned')}</th>
          <th>{t('common.pending')}</th>
          <th>{t('common.status_paid')}</th>
          <th>{t('common.actions')}</th>
        </tr>
      </thead>
      <tbody>
        {TRAINERS_FINANCE.map(tr => (
          <tr key={tr.id}>
            <td>
              <div className="af-v2-user-cell">
                <div className="af-v2-avatar trainer">{tr.name[0]}</div>
                <div>
                  <strong>{tr.name}</strong>
                  <p>{tr.studentsCount} {t('common.learners_count')}</p>
                </div>
              </div>
            </td>
            <td><strong className="text-primary">{tr.totalEarned} DT</strong></td>
            <td><strong className="text-warning">{tr.pending} DT</strong></td>
            <td><strong className="text-success">{tr.paid} DT</strong></td>
            <td>
              <div className="af-v2-actions-group">
                <button className="af-v2-action-text consult" onClick={() => onOpenDetail(tr)}>{t('common.view')}</button>
                <button className="af-v2-action-text archive" onClick={() => alert('Archivage...')}>{t('common.archive')}</button>
                <button className="af-v2-action-text delete" onClick={() => alert('Suppression...')}>{t('common.delete')}</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  );
};

// ── MODALS ──

const ClientDetailModal = ({ client, onClose }) => {
  const { t } = useTranslation();
  return (
  <div className="af-v2-modal-overlay">
    <div className="af-v2-modal-content wide">
      <div className="af-v2-modal-header">
        <h2>{t('common.financial_record')} : {client.name}</h2>
        <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
      </div>
      <div className="af-v2-modal-body">
        <div className="af-v2-modal-kpis">
          <div className="af-v2-modal-kpi"><span>{t('common.total_paid')}</span><h3>{client.totalPaid} DT</h3></div>
          <div className="af-v2-modal-kpi"><span>{t('common.remaining_to_pay')}</span><h3 className="text-danger">{client.remaining} DT</h3></div>
          <div className="af-v2-modal-kpi"><span>{t('common.formations')}</span><h3>{client.formationsCount}</h3></div>
        </div>
        <div className="af-v2-modal-table-box">
          <h4>{t('common.history')}</h4>
          <table className="af-v2-modal-table">
            <thead>
              <tr>
                <th>{t('common.formation')}</th>
                <th>{t('common.amount_col')}</th>
                <th>{t('common.status_paid')}</th>
                <th>{t('common.remain_col')}</th>
                <th>{t('common.invoice_col')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>React & Node Masterclass</td>
                <td>600 DT</td>
                <td>600 DT</td>
                <td>0 DT</td>
                <td><button className="af-v2-btn-icon"><i className="fas fa-file-invoice"></i></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="af-v2-modal-footer">
        <button className="af-v2-btn-secondary" onClick={() => alert('Téléchargement des factures...')}>
           <i className="fas fa-file-download"></i> {t('common.download_all_invoices')}
        </button>
        <button className="af-v2-btn-close" onClick={onClose}>{t('common.close')}</button>
      </div>
    </div>
  </div>
  );
};

const TrainerDetailModal = ({ trainer, onClose }) => {
  const { t } = useTranslation();
  return (
  <div className="af-v2-modal-overlay">
    <div className="af-v2-modal-content wide">
      <div className="af-v2-modal-header">
        <h2>{t('common.trainer_summary')} {t('common.trainer')} : {trainer.name}</h2>
        <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
      </div>
      <div className="af-v2-modal-body">
        <div className="af-v2-modal-kpis">
          <div className="af-v2-modal-kpi"><span>{t('common.total_earned')}</span><h3>{trainer.totalEarned} DT</h3></div>
          <div className="af-v2-modal-kpi"><span>{t('common.pending')}</span><h3 className="text-warning">{trainer.pending} DT</h3></div>
          <div className="af-v2-modal-kpi"><span>{t('common.status_paid')}</span><h3 className="text-success">{trainer.paid} DT</h3></div>
        </div>
        <div className="af-v2-modal-table-box">
          <h4>{t('common.taught_services')}</h4>
          <table className="af-v2-modal-table">
            <thead>
              <tr>
                <th>{t('common.formation')}</th>
                <th>{t('common.learners_count')}</th>
                <th>{t('common.gross_amount')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.statement_col')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>UI/UX Design Masterclass</td>
                <td>12</td>
                <td>1400 DT</td>
                <td><span className="af-v2-status-pill success">{t('common.status_paid')}</span></td>
                <td><button className="af-v2-btn-icon"><i className="fas fa-file-invoice"></i></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="af-v2-modal-footer">
        <button className="af-v2-btn-secondary" onClick={() => alert('Génération des relevés...')}>
           <i className="fas fa-file-pdf"></i> {t('common.download_reports')}
        </button>
        <button className="af-v2-btn-close" onClick={onClose}>{t('common.close')}</button>
      </div>
    </div>
  </div>
  );
};

export default AdminFinancePage;
