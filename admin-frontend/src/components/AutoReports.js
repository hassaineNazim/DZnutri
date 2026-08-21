import { useEffect, useState } from 'react';
import api from '../api/auth';
import { reportsAPI } from '../api/reports';
import EditProductModal from './EditProductModal';
import ReportCard from './ReportCard';
import { useToast } from './Toast';
import { PageHeader, StatePanel, StatusBadge } from './AdminUI';

const AutoReports = () => {
    const [reports, setReports] = useState([]);
    const [products, setProducts] = useState({}); // Cache for product data: { barcode: productData }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useToast();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null); // le signalement en cours de résolution
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const allReports = await reportsAPI.getPending();
            const autoReports = allReports.filter(r => r.type === 'automatiqueReport');
            setReports(autoReports);

            // Fetch product details for each report
            const productData = {};
            await Promise.all(autoReports.map(async (report) => {
                if (report.barcode && !productData[report.barcode]) {
                    try {
                        const prodResponse = await api.get(`/api/product/${report.barcode}`);
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
            setSelectedReport(report);
            setIsModalOpen(true);
        } else {
            toast.error("Impossible de trouver les détails du produit pour ce signalement.");
        }
    };

    const handleIgnore = async (report) => {
        try {
            await reportsAPI.updateStatus(report.id, 'ignored');
            setReports((prev) => prev.filter((r) => r.id !== report.id));
            toast.info(`Signalement #${report.id} ignoré.`);
        } catch (err) {
            console.error("Error ignoring report:", err);
            toast.error("Impossible d'ignorer ce signalement.");
        }
    };

    const handleSaveProduct = async (updatedData) => {
        if (!selectedProduct) return;

        try {
            setModalLoading(true);
            await api.put(`/api/admin/product/${selectedProduct.barcode}`, updatedData);

            // Le produit est corrigé : on clôt le signalement associé.
            if (selectedReport) {
                await reportsAPI.updateStatus(selectedReport.id, 'resolved');
                setReports((prev) => prev.filter((r) => r.id !== selectedReport.id));
            }
            setIsModalOpen(false);
            setSelectedReport(null);
            toast.success("Produit mis à jour, rescoré, et signalement clôturé !");

        } catch (err) {
            console.error("Error updating product:", err);
            toast.error("Erreur lors de la mise à jour du produit.");
        } finally {
            setModalLoading(false);
        }
    };

    if (loading) return <StatePanel loading>Chargement des signalements…</StatePanel>;

    if (error) return (
        <div className="admin-error-panel">{error}</div>
    );

    return (
        <div className="admin-page">
            <PageHeader
                eyebrow="Contrôle qualité"
                title="Signalements"
                accent="automatiques"
                aside={<StatusBadge>{reports.length} en attente</StatusBadge>}
            />

            {reports.length === 0 ? (
                <StatePanel>Aucun signalement automatique.</StatePanel>
            ) : (
                <div className="report-list">
                    {reports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onResolve={handleResolve}
                            onIgnore={handleIgnore}
                            image={products[report.barcode]?.image_url}
                            product={products[report.barcode]}
                            loading={modalLoading}
                            hideDetails={true}
                        />
                    ))}
                </div>
            )}

            {isModalOpen && (
                <EditProductModal
                    product={selectedProduct}
                    onClose={() => { setIsModalOpen(false); setSelectedReport(null); }}
                    onSave={handleSaveProduct}
                    loading={modalLoading}
                />
            )}
        </div>
    );
};

export default AutoReports;
