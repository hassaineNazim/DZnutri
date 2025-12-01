import axios from 'axios';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { authAPI } from '../api/auth';
import EditProductModal from './EditProductModal';
import ReportCard from './ReportCard';

const AutoReports = () => {
    const [reports, setReports] = useState([]);
    const [products, setProducts] = useState({}); // Cache for product data: { barcode: productData }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const token = authAPI.getToken();
            const response = await axios.get('/api/admin/reports', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const autoReports = response.data.filter(r => r.type === 'automatiqueReport');
            setReports(autoReports);

            // Fetch product details for each report
            const productData = {};
            await Promise.all(autoReports.map(async (report) => {
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
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                    Signalements Automatiques
                </h1>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {reports.length} en attente
                </span>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500">Aucun signalement automatique.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {reports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onResolve={handleResolve}
                            onIgnore={handleIgnore}
                            image={products[report.barcode]?.image_url}
                            hideDetails={true}
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

export default AutoReports;
