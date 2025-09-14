import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

const ApprovalModal = ({ submission, onClose, onConfirm, loading }) => {
  // --- États pour tous les champs du formulaire ---
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  
  // État pour les nutriments, gérés individuellement
  const [nutriments, setNutriments] = useState({
    'energy-kcal_100g': '',
    'saturated-fat_100g': '',
    'sugars_100g': '',
    'salt_100g': '',
  });

  // --- Initialisation du formulaire avec les données de la soumission ---
  useEffect(() => {
    if (submission) {
      setProductName(submission.productName || '');
      setBrand(submission.brand || '');
      setCategory(submission.typeProduct || '');
      setIngredientsText(submission.ocr_ingredients_text || '');
      // Idéalement, vous pourriez parser le texte OCR ici pour pré-remplir les nutriments
    }
  }, [submission]);

  // --- Gestion de la soumission ---
  const handleConfirm = () => {
    // 1. On prépare les données pour l'API
    const adminData = {
      product_name: productName,
      brand: brand,
      category: category,
      ingredients_text: ingredientsText,
      // On convertit les valeurs des nutriments en nombres
      nutriments: {
        'energy-kcal_100g': parseFloat(nutriments['energy-kcal_100g']) || 0,
        'saturated-fat_100g': parseFloat(nutriments['saturated-fat_100g']) || 0,
        'sugars_100g': parseFloat(nutriments.sugars_100g) || 0,
        'salt_100g': parseFloat(nutriments.salt_100g) || 0,
      },
      // Vous pouvez ajouter les autres champs comme additives_tags, etc. ici
    };

    // 2. On appelle la fonction du composant parent
    onConfirm(submission.id, adminData);
  };
  
  const handleNutrimentChange = (key, value) => {
      setNutriments(prev => ({ ...prev, [key]: value }));
  };

  if (!submission) return null;

  const API_BASE_URL = 'http://localhost:8000';
  const getImageUrl = (path) => `${API_BASE_URL}/${path}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* En-tête du Modal */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Approuver la soumission #{submission.id}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <X size={24} />
          </button>
        </div>

        {/* Corps du Modal (scrollable) */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne de gauche : Formulaire */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom du produit</label>
                <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Marque</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Texte des ingrédients (corrigé de l'OCR)</label>
                <textarea value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2 h-24" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Énergie (kcal)</label>
                    <input type="number" value={nutriments['energy-kcal_100g']} onChange={(e) => handleNutrimentChange('energy-kcal_100g', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Graisses sat. (g)</label>
                    <input type="number" value={nutriments['saturated-fat_100g']} onChange={(e) => handleNutrimentChange('saturated-fat_100g', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Sucres (g)</label>
                    <input type="number" value={nutriments.sugars_100g} onChange={(e) => handleNutrimentChange('sugars_100g', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Sel (g)</label>
                    <input type="number" value={nutriments.salt_100g} onChange={(e) => handleNutrimentChange('salt_100g', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
            </div>
            {/* Colonne de droite : Images de référence */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Photo de l'avant</label>
                <img src={getImageUrl(submission.image_front_url)} alt="Front" className="mt-1 w-full h-auto rounded-md border" />
              </div>
              {submission.image_ingredients_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Photo des ingrédients</label>
                  <img src={getImageUrl(submission.image_ingredients_url)} alt="Ingredients" className="mt-1 w-full h-auto rounded-md border" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pied de page du Modal */}
        <div className="flex justify-end items-center p-4 border-t bg-gray-50">
          <button onClick={onClose} className="bg-white border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-md mr-3">
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md flex items-center disabled:opacity-50"
          >
            {loading && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
            Confirmer l'approbation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;