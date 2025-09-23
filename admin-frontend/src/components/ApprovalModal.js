import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

const ApprovalModal = ({ submission, onClose, onConfirm, loading }) => {
  // --- États pour les champs du formulaire ---
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [additives, setAdditives] = useState(''); // Pour les additifs, sous forme de texte
  const [novaGroup, setNovaGroup] = useState(''); // Pour le groupe NOVA
  
  const [nutriments, setNutriments] = useState({
    'energy-kcal_100g': '',
    'saturated-fat_100g': '',
    'sugars_100g': '',
    'salt_100g': '',
    'proteins_100g': '', // Ajout
    'fiber_100g': '',      // Ajout
  });

  // --- Initialisation du formulaire avec les données de la soumission ---
  useEffect(() => {
    if (submission) {
      // Pré-remplissage des champs de base
      setProductName(submission.productName || '');
      setBrand(submission.brand || '');
      setCategory(submission.typeProduct || '');
      setIngredientsText(submission.ocr_ingredients_text || '');

      // Pré-remplissage des nutriments avec les valeurs parsées par le backend
      const parsed = submission.parsed_nutriments || {};
      setNutriments({
        'energy-kcal_100g': parsed['energy_kcal_100g']?.toString() || '',
        'saturated-fat_100g': parsed['saturated_fat_100g']?.toString() || '',
        'sugars_100g': parsed['sugars_100g']?.toString() || '',
        'salt_100g': parsed['salt_100g']?.toString() || '',
        'proteins_100g': parsed['proteins_100g']?.toString() || '',
        'fiber_100g': parsed['fiber_100g']?.toString() || '',
      });
    }
  }, [submission]);

  // --- Gestion de la soumission ---
  const handleConfirm = () => {
    // 1. On prépare les données finales pour l'API
    const adminData = {
      product_name: productName,
      brand,
      category,
      ingredients_text: ingredientsText,
      // On convertit les valeurs des nutriments en nombres
      nutriments: {
        'energy-kcal_100g': parseFloat(nutriments['energy-kcal_100g']) || 0,
        'saturated-fat_100g': parseFloat(nutriments['saturated-fat_100g']) || 0,
        'sugars_100g': parseFloat(nutriments.sugars_100g) || 0,
        'salt_100g': parseFloat(nutriments.salt_100g) || 0,
        'proteins_100g': parseFloat(nutriments.proteins_100g) || 0,
        'fiber_100g': parseFloat(nutriments.fiber_100g) || 0,
      },
      // On transforme la chaîne d'additifs en une liste
      additives_tags: additives.split(',').map(tag => tag.trim()).filter(Boolean),
      nova_group: parseInt(novaGroup) || null,
    };

    // 2. On appelle la fonction du composant parent
    onConfirm(submission.id, adminData);
  };
  
  const handleNutrimentChange = (key, value) => {
      setNutriments(prev => ({ ...prev, [key]: value }));
  };

  if (!submission) return null;

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/400x300?text=Image+Not+Found';
    return path.startsWith('http') ? path : `http://localhost:8000/${path}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Approuver la soumission #{submission.id}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
        </div>

        {/* Corps (scrollable) */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Colonne de gauche : Formulaire */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom du produit</label>
                  <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marque</label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ingrédients (corrigé de l'OCR)</label>
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
                <div>
                    <label className="block text-sm font-medium text-gray-700">Protéines (g)</label>
                    <input type="number" value={nutriments.proteins_100g} onChange={(e) => handleNutrimentChange('proteins_100g', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fibres (g)</label>
                    <input type="number" value={nutriments.fiber_100g} onChange={(e) => handleNutrimentChange('fiber_100g', e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Groupe NOVA (1-4)</label>
                  <input type="number" value={novaGroup} onChange={(e) => setNovaGroup(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Additifs (ex: e330, e951)</label>
                  <input type="text" value={additives} onChange={(e) => setAdditives(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md p-2" placeholder="Séparés par une virgule" />
                </div>
              </div>
            </div>

            {/* Colonne de droite : Image des ingrédients */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Photo des ingrédients</label>
              <img src={getImageUrl(submission.image_ingredients_url)} alt="Ingredients" className="mt-1 w-full h-auto rounded-md border" />
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="flex justify-end items-center p-4 border-t bg-gray-50">
          <button onClick={onClose} className="bg-white border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-md mr-3">Annuler</button>
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