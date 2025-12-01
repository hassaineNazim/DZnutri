import { AlertTriangle, Check, ChevronDown, ChevronUp, User, X } from 'lucide-react';
import { useState } from 'react';

const ReportCard = ({ report, onResolve, onIgnore, loading, image, hideDetails }) => {
    const [showDetails, setShowDetails] = useState(false);

    // Helper to safely display dates
    const formatDate = (dateString) => {
        if (!dateString) return 'Date inconnue';
        return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
    };

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {/* --- Main Section --- */}
            <div className="p-4 flex items-start justify-between">
                <div className="flex-1 mr-4">
                    <div className="flex items-center space-x-2 mb-1">
                        {report.type === 'automatiqueReport' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Auto
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                <User className="w-3 h-3 mr-1" />
                                Utilisateur
                            </span>
                        )}
                        <span className="text-xs text-gray-500">{formatDate(report.created_at)}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900">
                        {report.barcode ? `Produit ${report.barcode}` : 'Produit Inconnu'}
                    </h3>

                    {/* Description shown as the "main" content since we might not have product name/brand */}
                    <p className="text-base text-gray-600 mb-3 mt-2">
                        {report.description || 'Aucune description fournie.'}
                    </p>

                    <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                        ID: {report.id}
                    </p>
                </div>

                {/* Image Section */}
                <div className="flex-shrink-0">
                    {image ? (
                        <img
                            src={image}
                            alt="Product"
                            className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white"
                        />
                    ) : (
                        <div className="bg-gray-100 rounded-lg w-24 h-24 flex items-center justify-center text-gray-400 border border-gray-200">
                            <span className="text-xs text-center p-1">Image non disponible</span>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Details Section --- */}
            {showDetails && !hideDetails && (
                <div className="px-4 pb-4 border-t border-gray-200">
                    <h4 className="text-md font-semibold text-gray-800 mt-3 mb-2">Détails du Signalement</h4>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message / Description
                            </label>
                            <div className="w-full p-3 border rounded bg-gray-50 text-sm text-gray-800">
                                {report.description || 'N/A'}
                            </div>
                        </div>
                        {report.user_id && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Signalé par l'utilisateur (ID)
                                </label>
                                <div className="text-sm text-gray-800">{report.user_id}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- Actions Bar --- */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                {!hideDetails && (
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                        {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <span>{showDetails ? 'Moins' : 'Plus'} de détails</span>
                    </button>
                )}
                {hideDetails && <div></div>} {/* Spacer if details button is hidden */}

                {report.status === 'pending' && (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onResolve(report)}
                            disabled={loading}
                            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" />
                            <span className="text-sm font-semibold">Traiter</span>
                        </button>
                        <button
                            onClick={() => onIgnore(report)}
                            disabled={loading}
                            className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 disabled:opacity-50"
                        >
                            <X className="h-4 w-4" />
                            <span className="text-sm font-semibold">Ignorer</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportCard;
