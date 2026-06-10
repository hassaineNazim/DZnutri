import axios from 'axios';

import { useEffect, useState } from 'react';
import { authAPI } from '../api/auth';
import ReportTable from './ReportTable';

const AdditiveReports = () => {
    const [additives, setAdditives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAdditives = async () => {
            try {
                const token = authAPI.getToken();
                // Note: Using the requested endpoint. If it doesn't exist, this will fail.
                // In a real scenario, we might need to mock this or handle 404s gracefully.
                const response = await axios.get('/api/admin/pending-additives', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAdditives(response.data);
            } catch (err) {
                console.error("Error fetching additives:", err);
                // Fallback for demo if endpoint doesn't exist yet
                if (err.response && err.response.status === 404) {
                    setError("L'endpoint /api/admin/pending-additives n'existe pas encore.");
                } else {
                    setError("Impossible de charger les additifs.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAdditives();
    }, []);


    const columns = [
        { header: 'Code Additif', accessor: 'code' },
        { header: 'Apparitions', accessor: 'count' },
        {
            header: 'Statut',
            accessor: 'status',
            render: (item) => (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'new' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {item.status}
                </span>
            )
        },
    ];

    // Custom action column render for this specific table

    if (loading) return <div className="p-4">Chargement...</div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Additifs Inconnus</h1>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {additives.length} détectés
                </span>
            </div>

            {/* We use a slightly modified table here or just the generic one if it fits. 
          Since ReportTable is generic, we can pass a custom render for actions if we modify ReportTable,
          OR we can just use the generic onAction for a primary action and maybe add a secondary one.
          For simplicity, let's use the generic one but maybe we need to extend it for multiple actions later.
          For now, let's just use the generic one with a "Gérer" button that could open a modal with Add/Ignore options.
      */}
            <ReportTable
                data={additives}
                columns={columns}
                onAction={(item) => alert(`Gérer ${item.code}`)}
                actionLabel="Gérer"
            />
        </div>
    );
};

export default AdditiveReports;
