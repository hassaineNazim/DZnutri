import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

const ApprovalModal = ({ submission, onClose, onConfirm, loading }) => {
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');

  // Nouveau champ pour le scoring précis
  const [typeSpecifique, setTypeSpecifique] = useState('');
  const [subcategory, setSubcategory] = useState('');

  // Mapping des sous-catégories par type spécifique
  const subcategoryOptions = {
    'solid': ['Gâteaux et pâtisseries', 'Plats préparés', 'Céréales', 'Snacks salés', 'Confiseries', 'Autre'],
    'boissons': ['Sodas', 'Jus de fruits', 'Thé et infusions', 'Café', 'Boissons énergisantes', 'Autre'],
    'matières grasses': ['Huile', 'Beurre', 'Margarine', 'Mayonnaise', 'Autre'],
    'fromages': ['Fromage frais', 'Fromage à pâte dure', 'Fromage à pâte molle', 'Fromage fondu', 'Autre'],
    'eau': ['Eau plate', 'Eau gazeuse', 'Eau aromatisée']
  };

  const [ingredientsText, setIngredientsText] = useState('');
  const [additives, setAdditives] = useState('');
  const [novaGroup, setNovaGroup] = useState('');

  const [nutriments, setNutriments] = useState({
    'energy-kcal_100g': '',
    'saturated-fat_100g': '',
    'sugars_100g': '',
    'salt_100g': '',
    'proteins_100g': '',
    'fiber_100g': '',
  });

  useEffect(() => {
    if (submission) {
      setProductName(submission.productName || '');
      setBrand(submission.brand || '');
      // On pré-remplit avec ce que l'utilisateur a choisi, ou 'solid' par défaut
      setTypeSpecifique(submission.typeSpecifique || 'solid');
      setSubcategory(submission.subcategory || '');
      setIngredientsText(submission.ocr_ingredients_text || '');

      // Parsing des nutriments
      let parsedNutriments = {};
      if (typeof submission.parsed_nutriments === 'string') {
        try {
          parsedNutriments = JSON.parse(submission.parsed_nutriments);
        } catch (e) { console.error("Erreur parsing nutriments:", e); }
      } else {
        parsedNutriments = submission.parsed_nutriments || {};
      }
      setNutriments({
        'energy-kcal_100g': parsedNutriments['energy-kcal_100g']?.toString() || '',
        'saturated-fat_100g': parsedNutriments['saturated-fat_100g']?.toString() || '',
        'sugars_100g': parsedNutriments['sugars_100g']?.toString() || '',
        'salt_100g': parsedNutriments['salt_100g']?.toString() || '',
        'proteins_100g': parsedNutriments['proteins_100g']?.toString() || '',
        'fiber_100g': parsedNutriments['fiber_100g']?.toString() || '',
      });

      // Parsing des additifs
      let additivesData = submission.found_additives;
      if (typeof additivesData === 'string') {
        try { additivesData = JSON.parse(additivesData); }
        catch (e) { additivesData = []; }
      }
      const additivesArray = Array.isArray(additivesData) ? additivesData : [];
      const additivesString = additivesArray
        .map(add => add.e_number || add.e_code)
        .filter(Boolean)
        .join(', ');

      setAdditives(additivesString);
      setNovaGroup(submission.nova_group?.toString() || '');
    }
  }, [submission]);


  const handleConfirm = () => {
    const adminData = {
      product_name: productName,
      brand: brand,
      // IMPORTANT : On envoie le type spécifique comme "category" pour le scoring backend
      category: typeSpecifique,
      subcategory: subcategory || null,
      ingredients_text: ingredientsText,
      nutriments: {
        'energy-kcal_100g': parseFloat(nutriments['energy-kcal_100g']) || 0,
        'saturated-fat_100g': parseFloat(nutriments['saturated-fat_100g']) || 0,
        'sugars_100g': parseFloat(nutriments.sugars_100g) || 0,
        'salt_100g': parseFloat(nutriments.salt_100g) || 0,
        'proteins_100g': parseFloat(nutriments.proteins_100g) || 0,
        'fiber_100g': parseFloat(nutriments.fiber_100g) || 0,
      },
      additives_tags: additives.split(',').map(tag => tag.trim()).filter(Boolean),
      nova_group: parseInt(novaGroup) || null,
    };

    onConfirm(submission.id, adminData);
  };


  const handleNutrimentChange = (key, value) => {
    setNutriments(prev => ({ ...prev, [key]: value }));
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `http://localhost:8000/${path}`;
  };

  if (!submission) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">

        {/* En-tête */}
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">
            {submission.status === 'flagged' ? '🚨 Correction signalement' : `Validation #${submission.id}`}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors"><X size={24} /></button>
        </div>

        {/* Corps (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* COLONNE GAUCHE : FORMULAIRE DE DONNÉES */}
            <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Données Produit</h3>

              {/* Identité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du produit</label>
                  <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Marque</label>
                  <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {/* --- TYPE SPÉCIFIQUE (NOUVEAU) --- */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-blue-800 mb-1">Type Spécifique (Crucial pour le Score)</label>
                  <select
                    value={typeSpecifique}
                    onChange={(e) => {
                      setTypeSpecifique(e.target.value);
                      setSubcategory(''); // Reset subcategory when type changes
                    }}
                    className="w-full border-2 border-blue-100 bg-blue-50/50 rounded-lg p-2.5 text-gray-800 font-medium focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="solid">Solide (Standard : Gâteaux, Plats...)</option>
                    <option value="boissons">Boissons (Sodas, Jus, Thé...)</option>
                    <option value="matières grasses">Matières Grasses (Huile, Beurre, Mayo)</option>
                    <option value="fromages">Fromages</option>
                    <option value="eau">Eau (Naturelle uniquement)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Sélectionnez la catégorie exacte pour que l'algorithme applique les bons seuils.</p>
                </div>

                {/* Sous-catégorie (appears when type is selected) */}
                {typeSpecifique && subcategoryOptions[typeSpecifique] && (
                  <div className="pl-4 border-l-2 border-blue-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sous-catégorie</label>
                    <select
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-gray-700 focus:border-blue-500 outline-none cursor-pointer"
                    >
                      <option value="">-- Sélectionner --</option>
                      {subcategoryOptions[typeSpecifique].map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Précisez le type de produit pour un meilleur filtrage.</p>
                  </div>
                )}
              </div>

              {/* Nutriments */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-4 uppercase text-xs tracking-wider">Valeurs pour 100g/ml</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Énergie (kcal)</label>
                    <input type="number" value={nutriments['energy-kcal_100g']} onChange={(e) => handleNutrimentChange('energy-kcal_100g', e.target.value)} className="w-full border rounded-md p-2" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Graisses Saturées (g)</label>
                    <input type="number" value={nutriments['saturated-fat_100g']} onChange={(e) => handleNutrimentChange('saturated-fat_100g', e.target.value)} className="w-full border rounded-md p-2" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Sucres (g)</label>
                    <input type="number" value={nutriments['sugars_100g']} onChange={(e) => handleNutrimentChange('sugars_100g', e.target.value)} className="w-full border rounded-md p-2" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Sel (g)</label>
                    <input type="number" value={nutriments['salt_100g']} onChange={(e) => handleNutrimentChange('salt_100g', e.target.value)} className="w-full border rounded-md p-2" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Protéines (g)</label>
                    <input type="number" value={nutriments['proteins_100g']} onChange={(e) => handleNutrimentChange('proteins_100g', e.target.value)} className="w-full border rounded-md p-2" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Fibres (g)</label>
                    <input type="number" value={nutriments['fiber_100g']} onChange={(e) => handleNutrimentChange('fiber_100g', e.target.value)} className="w-full border rounded-md p-2" />
                  </div>
                </div>
              </div>

              {/* Additifs & Nova */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">NOVA (1-4)</label>
                  <input type="number" max="4" min="1" value={novaGroup} onChange={(e) => setNovaGroup(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Additifs (Codes E)</label>
                  <input type="text" value={additives} onChange={(e) => setAdditives(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5" placeholder="E330, E450..." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ingrédients (Texte)</label>
                <textarea rows="4" value={ingredientsText} onChange={(e) => setIngredientsText(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono bg-gray-50" />
              </div>
            </div>

            {/* COLONNE DROITE : PREUVES VISUELLES (IMAGES) */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">Preuves Visuelles</h3>

              {/* 1. Tableau Nutritionnel (Le plus important pour les chiffres) */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-700 flex items-center gap-2">📊 Tableau Nutritionnel</span>
                  {!getImageUrl(submission.image_nutrition_url) && <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">Manquant</span>}
                </div>
                <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center min-h-[160px]">
                  {getImageUrl(submission.image_nutrition_url) ? (
                    <a href={getImageUrl(submission.image_nutrition_url)} target="_blank" rel="noreferrer" className="w-full">
                      <img src={getImageUrl(submission.image_nutrition_url)} alt="Nutrition" className="w-full h-auto max-h-[300px] object-contain hover:scale-105 transition-transform duration-300 cursor-zoom-in" />
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Pas de photo du tableau</span>
                  )}
                </div>
              </div>

              {/* 2. Liste des Ingrédients (Pour additifs) */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-gray-700 flex items-center gap-2">📝 Liste Ingrédients</span>
                </div>
                <div className="bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center min-h-[160px]">
                  {getImageUrl(submission.image_ingredients_url) ? (
                    <a href={getImageUrl(submission.image_ingredients_url)} target="_blank" rel="noreferrer" className="w-full">
                      <img src={getImageUrl(submission.image_ingredients_url)} alt="Ingrédients" className="w-full h-auto max-h-[300px] object-contain hover:scale-105 transition-transform duration-300 cursor-zoom-in" />
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">Pas de photo ingrédients</span>
                  )}
                </div>
              </div>




            </div>

          </div>
        </div>

        {/* Pied de page (Actions) */}
        <div className="flex justify-end items-center p-5 border-t bg-white gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-8 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-md hover:shadow-lg flex items-center transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            )}
            {submission.status === 'flagged' ? 'Corriger & Valider' : 'Approuver le produit'}
          </button>
        </div>

      </div>
    </div >
  );
};

export default ApprovalModal;