import { CheckCircle2, Package, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { submissionsAPI } from '../api/submissions';
import { PageHeader, StatePanel } from './AdminUI';
import ApprovalModal from './ApprovalModal';
import SubmissionCard from './SubmissionCard';

const FILTERS = [
  ['pending', 'En attente'],
  ['approved', 'Approuvés'],
  ['rejected', 'Rejetés'],
];

const Dashboard = () => {
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [pending, approved, rejected] = await Promise.all([
        submissionsAPI.getSubmissions('pending'),
        submissionsAPI.getSubmissions('approved'),
        submissionsAPI.getSubmissions('rejected'),
      ]);
      setAllSubmissions([
        ...(pending.submissions || []),
        ...(approved.submissions || []),
        ...(rejected.submissions || []),
      ]);
    } catch (err) {
      setError('Impossible de charger les soumissions. Réessayez dans quelques instants.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => ({
    pending: allSubmissions.filter((s) => s.status === 'pending').length,
    approved: allSubmissions.filter((s) => s.status === 'approved').length,
    rejected: allSubmissions.filter((s) => s.status === 'rejected').length,
  }), [allSubmissions]);

  const filteredSubmissions = useMemo(
    () => allSubmissions.filter((s) => s.status === filter),
    [allSubmissions, filter],
  );

  const handleConfirmApproval = async (submissionId, adminData) => {
    try {
      setActionLoading(true);
      await submissionsAPI.approveSubmission(submissionId, adminData);
      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setError("Impossible d'approuver cette soumission.");
      console.error('Error approving submission:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (submissionId) => {
    try {
      setActionLoading(true);
      await submissionsAPI.rejectSubmission(submissionId);
      await fetchData();
    } catch {
      setError('Impossible de rejeter cette soumission.');
    } finally {
      setActionLoading(false);
    }
  };

  const filterControls = (
    <>
      <span className="admin-filter-label">Filtrer</span>
      <div className="admin-segmented" role="group" aria-label="Filtrer les soumissions">
        {FILTERS.map(([value, label]) => (
          <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)} aria-pressed={filter === value}>
            {label}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Modération" title="Soumissions de" accent="produits" aside={filterControls} />

      <div className="admin-kpi-grid">
        <Kpi icon={Package} iconTone="pending" label="En attente" value={stats.pending} highlight />
        <Kpi icon={CheckCircle2} iconTone="success" label="Approuvés" value={stats.approved} />
        <Kpi icon={XCircle} iconTone="danger" label="Rejetés" value={stats.rejected} />
      </div>

      {error && <div className="admin-error-panel">{error}</div>}

      {loading ? (
        <StatePanel loading>Chargement des soumissions…</StatePanel>
      ) : filteredSubmissions.length === 0 ? (
        <StatePanel>Aucune soumission dans cette catégorie.</StatePanel>
      ) : (
        <div className="submission-list">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onApprove={(item) => { setSelectedSubmission(item); setIsModalOpen(true); }}
              onReject={handleReject}
              loading={actionLoading}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <ApprovalModal
          submission={selectedSubmission}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmApproval}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

const Kpi = ({ icon: Icon, iconTone, label, value, highlight = false }) => (
  <div className={`admin-kpi-card${highlight ? ' highlight' : ''}`}>
    <span className={`admin-kpi-icon ${iconTone}`}><Icon size={25} /></span>
    <div>
      <div className="admin-kpi-label">{label}</div>
      <div className="admin-kpi-value">{value}</div>
    </div>
  </div>
);

export default Dashboard;
