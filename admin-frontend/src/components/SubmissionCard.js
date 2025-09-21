import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useState } from 'react'; // "React" doit être importé

const SubmissionCard = ({ submission, onApprove, onReject, loading }) => {
  const [showDetails, setShowDetails] = useState(false);
   const [fullscreenImage, setFullscreenImage] = useState(null);

  const getImageUrl = (path) => {   
    if (path.startsWith('http')) {
    return path;
  } else {
    return `Error: ${path} is not a valid URL.`;
  } 
};

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* --- Partie Principale (inchangée) --- */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex-1 mr-4">
          <h3 className="text-lg font-bold text-gray-900">{submission.productName || 'N/A'}</h3>
          <p className="text-base text-gray-600 mb-3">{submission.brand || 'N/A'}</p>
          <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">{submission.barcode}</p>
        </div>
        <div className="flex-shrink-0">
          <button onClick={() => setFullscreenImage(getImageUrl(submission.image_front_url))}>
            <img
              src={getImageUrl(submission.image_front_url)}
              alt="Product Front"
              className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
            />
          </button>
        </div>
      </div>

      {/* --- SECTION DÉTAILS (inchangée) --- */}
      {showDetails && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <h4 className="text-md font-semibold text-gray-800 mt-3 mb-2">Ingrédients</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texte Détecté (IA)
              </label>
              <textarea
                readOnly
                className="w-full h-48 p-2 border rounded bg-gray-50 font-mono text-xs"
                value={submission.ocr_ingredients_text || 'Aucun texte détecté.'}
              />
            </div>
            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Image Fournie
  </label>
  
  {submission.image_ingredients_url ? (
    // On ajoute les classes flex au conteneur de l'image
    <div className="w-full h-48 flex justify-center items-center bg-gray-50 rounded-lg border border-gray-200">
      <button onClick={() => setFullscreenImage(getImageUrl(submission.image_ingredients_url))}> 
        <img
          src={getImageUrl(submission.image_ingredients_url)}
          alt="Product Ingredients"
          // L'image prendra la hauteur max et sera contenue
          className="max-h-48 max-w-48 object-contain rounded-lg"
        />
      </button>
    </div>
  ) : (
    <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
      <p className="text-sm text-gray-500">Pas d'image</p>
    </div>
  )}
</div>
          </div>
        </div>
      )}

      {/* --- Barre d'actions (modifiée) --- */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
        >
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span>{showDetails ? 'Moins' : 'Plus'} de détails</span>
        </button>

        {submission.status === 'pending' && (
          <div className="flex space-x-2">
            <button 
              
              // On passe l'objet submission entier à la fonction onApprove
              onClick={() => onApprove(submission)} 
             
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
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex justify-center items-center z-50"
          onClick={() => setFullscreenImage(null)} // Ferme le modal au clic sur le fond
        >
          <img
            src={fullscreenImage}
            alt="Product Fullscreen"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default SubmissionCard;