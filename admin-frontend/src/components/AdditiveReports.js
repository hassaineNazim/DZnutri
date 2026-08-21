import { useEffect, useState } from 'react';
import api from '../api/auth';
import { PageHeader, StatePanel, StatusBadge } from './AdminUI';
import ReportTable from './ReportTable';

const AdditiveReports = () => {
  const [additives, setAdditives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdditives = async () => {
      try {
        const response = await api.get('/api/admin/pending-additives');
        setAdditives(response.data);
      } catch (err) {
        console.error('Error fetching additives:', err);
        setError('Impossible de charger les additifs.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdditives();
  }, []);

  const columns = [
    {
      header: 'Code additif',
      accessor: 'code',
      render: (item) => <span className="admin-table-code">{item.code}</span>,
    },
    { header: 'Apparitions', accessor: 'count' },
    {
      header: 'Statut',
      accessor: 'status',
      render: (item) => <StatusBadge tone="soft">{item.status || 'nouveau'}</StatusBadge>,
    },
  ];

  if (loading) return <StatePanel loading>Chargement des additifs…</StatePanel>;
  if (error) return <div className="admin-error-panel">{error}</div>;

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Base de connaissances"
        title="Additifs"
        accent="inconnus"
        aside={<StatusBadge tone="yellow">{additives.length} détectés</StatusBadge>}
      />
      <ReportTable
        data={additives}
        columns={columns}
        onAction={(item) => window.alert(`Gestion de ${item.code} bientôt disponible`)}
        actionLabel="Gérer"
      />
    </div>
  );
};

export default AdditiveReports;
