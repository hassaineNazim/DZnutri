import axios from 'axios';
import { Activity, RefreshCw, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { authAPI } from '../api/auth';
import EditProductModal from './EditProductModal';
import ReportCard from './ReportCard';

const UserReports = () => {
    const [allReports, setAllReports] = useState([]); // Store all fetched reports
    const [displayedReports, setDisplayedReports] = useState([]); // Store filtered reports
    const [products, setProducts] = useState({}); // Cache for product data: { barcode: productData }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('user'); // 'user' or 'scoring'

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    // Filter reports whenever activeTab or allReports changes
    useEffect(() => {
        const typeToFilter = activeTab === 'user' ? 'userreportapp' : 'scoringReport';
        const filtered = allReports.filter(r => r.type === typeToFilter);
        setDisplayedReports(filtered);
    }, [activeTab, allReports]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const token = authAPI.getToken();
            const response = await axios.get('/api/admin/reports', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Store all reports initially
            console.log("All fetched reports:", response.data);
            setAllReports(response.data);

            // Fetch product details for each report
            const productData = {};
            await Promise.all(response.data.map(async (report) => {
                if (report.barcode && !productData[report.barcode]) {
                    try {
                        const prodResponse = await axios.get(`/api/product/${report.barcode}`);
                        if (prodResponse.data.product) {
                            productData[report.barcode] = prodResponse.data.product;
                        }
                    } catch (e) {
                        console.warn(`Failed to fetch product ${report.barcode}`, e);
                    }
                }
            }));
            setProducts(productData);

        } catch (err) {
            console.error("Error fetching reports:", err);
            setError("Impossible de charger les signalements.");
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = (report) => {
        const product = products[report.barcode];
        if (product) {
            setSelectedProduct(product);
            setIsModalOpen(true);
        } else {
            alert("Impossible de trouver les détails du produit pour ce signalement.");
        }
    };

    const handleIgnore = (report) => {
        alert(`Signalement ${report.id} ignoré (Logique à implémenter)`);
    };

    const handleSaveProduct = async (updatedData) => {
        if (!selectedProduct) return;

        try {
            setModalLoading(true);
            const token = authAPI.getToken();
            await axios.put(`/api/admin/product/${selectedProduct.barcode}`, updatedData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh data
            await fetchReports();
            setIsModalOpen(false);
            alert("Produit mis à jour et rescoré avec succès !");

        } catch (err) {
            console.error("Error updating product:", err);
            alert("Erreur lors de la mise à jour du produit.");
        } finally {
            setModalLoading(false);
        }
    };

    if (loading) return (
        <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Chargement...</p>
        </div>
    );

    if (error) return (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <User className="h-6 w-6 text-purple-500 mr-2" />
                    Signalements Utilisateurs
                </h1>

                {/* Toggle Buttons */}
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        onClick={() => setActiveTab('user')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'user'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Bug report
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('scoring')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'scoring'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            Scoring report
                        </div>
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${activeTab === 'user' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {displayedReports.length} signalements {activeTab === 'user' ? 'utilisateurs' : 'scoring'}
                </span>
            </div>

            {displayedReports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">Aucun signalement de type "{activeTab}".</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {displayedReports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onResolve={handleResolve}
                            onIgnore={handleIgnore}
                            image={report.image_url}
                        />
                    ))}
                </div>
            )}

            {isModalOpen && (
                <EditProductModal
                    product={selectedProduct}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveProduct}
                    loading={modalLoading}
                />
            )}
        </div>
    );
};

export default UserReports;
