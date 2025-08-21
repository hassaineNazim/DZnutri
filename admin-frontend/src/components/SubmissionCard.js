import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react';

const SubmissionCard = ({ submission, onApprove, onReject, loading }) => {
  // 1. On ajoute un état pour gérer la visibilité des détails
  const [showDetails, setShowDetails] = useState(false);

  // Assurez-vous que cette URL correspond à l'adresse de votre backend
  const API_BASE_URL = 'http://localhost:8000';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150?text=No+Image';
    return `${API_BASE_URL}/${path}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4 flex items-start ">
        {/* Partie gauche : Informations */}
        <div className="flex-1 mr-4 justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {submission.productName || 'Nom non spécifié'}
          </h3>
          <p className="text-base text-gray-600 mb-3">
            {submission.brand || 'Marque non spécifiée'}
          </p>
          <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
            {submission.barcode}
          </p>
        </div>
        {/* Partie droite : Image du produit */}
        <div className="flex-shrink-0">
          <img
            src={getImageUrl(submission.image_front_url)}
            alt="Product Front"
            className="w-36 h-36 object-cover rounded-lg border border-gray-200"
          />
        </div>
      </div>

      {/* --- SECTION DÉTAILS (AFFICHÉE CONDITIONNELLEMENT) --- */}
      {showDetails && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-800 mt-3 mb-2">Détails de la soumission</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colonne 1 */}
            <div>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Type:</span> {submission.typeProduct || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Soumis le:</span> {formatDate(submission.submitted_at)}
              </p>
              <p className="text-sm text-gray-500">
                <span className="font-medium">Par:</span> Utilisateur #{submission.submitted_by_user_id}
              </p>
            </div>
            {/* Colonne 2 : Image des ingrédients */}
            {submission.image_ingredients_url && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingrédients
                </label>
                <img
                  src={getImageUrl(submission.image_ingredients_url)}
                  alt="Product Ingredients"
                  className="w-full h-auto object-contain rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barre d'actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        {/* Bouton pour afficher/cacher les détails */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
        >
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span>{showDetails ? 'Moins' : 'Plus'} de détails</span>
        </button>

        {/* Boutons Approuver/Rejeter */}
        {submission.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={() => onApprove(submission.id)}
              disabled={loading}
              className="flex items-center justify-center space-x-2 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span className="text-sm font-semibold">Approve</span>
            </button>
            <button
              onClick={() => onReject(submission.id)}
              disabled={loading}
              className="flex items-center justify-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              <span className="text-sm font-semibold">Reject</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionCard;