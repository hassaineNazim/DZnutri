import { CheckCircle, Filter, LogOut, Package, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';
import { submissionsAPI } from '../api/submissions';
import ApprovalModal from './ApprovalModal';
import SubmissionCard from './SubmissionCard';

const Dashboard = () => {
  // Un seul état pour stocker TOUTES les soumissions
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const navigate = useNavigate();

  // Une seule fonction pour tout récupérer du backend
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
      setError('Failed to fetch data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // On lance la récupération des données une seule fois au chargement
  useEffect(() => {
    fetchData();
  }, []);

  // Les stats sont maintenant un calcul, pas un appel API.
  const stats = useMemo(() => ({
    pending: allSubmissions.filter(s => s.status === 'pending').length,
    approved: allSubmissions.filter(s => s.status === 'approved').length,
    rejected: allSubmissions.filter(s => s.status === 'rejected').length,
  }), [allSubmissions]);

  // La liste affichée est aussi un calcul.
  const filteredSubmissions = useMemo(() => {
    return allSubmissions.filter(s => s.status === filter);
  }, [allSubmissions, filter]);

  const handleOpenApproveModal = (submission) => {
    setSelectedSubmission(submission);
    setIsModalOpen(true);
  };

  // --- FONCTION CORRIGÉE ---
  const handleConfirmApproval = async (submissionId, adminData) => {
    try {
      setActionLoading(true);
      await submissionsAPI.approveSubmission(submissionId, adminData);
      // Après une action, on rafraîchit simplement toutes les données
      await fetchData();
      setIsModalOpen(false);
      // --- AJOUTEZ CETTE LIGNE ---
      window.location.reload();
      // --------------------------
    } catch (err) {
      setError('Failed to approve submission.');
      console.error('Error approving submission:', err);
    } finally {
      setActionLoading(false);

    }
  };

  const handleReject = async (submissionId) => {
    try {
      setActionLoading(true);
      await submissionsAPI.rejectSubmission(submissionId);
      // Après une action, on rafraîchit simplement toutes les données
      await fetchData();
    } catch (err) {
      setError('Failed to reject submission.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">DZnutri Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={handleRefresh} disabled={loading} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button onClick={handleLogout} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Section des Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <Package className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Approuvé</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.approved}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Rejeté</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.rejected}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Filtre */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Soumissions de produits</h2>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="pending">En attente</option>
                  <option value="approved">Approuvé</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Liste des soumissions */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune soumission</h3>
              <p className="text-gray-500">Il n'y a aucune soumission avec le statut "{filter}".</p>
            </div>
          ) : (
            filteredSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onApprove={handleOpenApproveModal}
                onReject={handleReject}
                loading={actionLoading}
              />
            ))
          )}
        </div>
      </main>

      {/* Modal d'approbation */}
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

export default Dashboard;