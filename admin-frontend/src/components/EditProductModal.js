import { Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const EditProductModal = ({ product, onClose, onSave, loading }) => {
    const [formData, setFormData] = useState({
        product_name: '',
        brand: '',
        nutriscore_grade: '',
        nova_group: '',
        additives_tags: '', // Changed from ingredients_text
        nutriments: {
            'energy-kcal_100g': 0,
            'sugars_100g': 0,
            'salt_100g': 0,
            'saturated-fat_100g': 0,
            'proteins_100g': 0,
            'fiber_100g': 0,
            'fruits-vegetables-nuts-estimate-from-ingredients_100g': 0
        }
    });

    useEffect(() => {
        if (product) {
            setFormData({
                product_name: product.product_name || '',
                brand: product.brand || '',
                nutriscore_grade: product.nutriscore_grade || '',
                nova_group: product.nova_group || '',
                additives_tags: product.additives_tags ? product.additives_tags.join(', ') : '', // Convert list to string
                nutriments: {
                    'energy-kcal_100g': product.nutriments?.['energy-kcal_100g'] || 0,
                    'sugars_100g': product.nutriments?.['sugars_100g'] || 0,
                    'salt_100g': product.nutriments?.['salt_100g'] || 0,
                    'saturated-fat_100g': product.nutriments?.['saturated-fat_100g'] || 0,
                    'proteins_100g': product.nutriments?.['proteins_100g'] || 0,
                    'fiber_100g': product.nutriments?.['fiber_100g'] || 0,
                    'fruits-vegetables-nuts-estimate-from-ingredients_100g': product.nutriments?.['fruits-vegetables-nuts-estimate-from-ingredients_100g'] || 0
                }
            });
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNutrimentChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            nutriments: {
                ...prev.nutriments,
                [name]: parseFloat(value) || 0
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Convert additives string back to array
        const processedData = {
            ...formData,
            additives_tags: formData.additives_tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        };
        onSave(processedData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        Modifier le produit : {product?.barcode}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom du produit</label>
                                <input
                                    type="text"
                                    name="product_name"
                                    value={formData.product_name}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Marque</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                        </div>

                        {/* Scores */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nutri-Score (a, b, c, d, e)</label>
                                <input
                                    type="text"
                                    name="nutriscore_grade"
                                    value={formData.nutriscore_grade}
                                    onChange={handleChange}
                                    maxLength={1}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Groupe NOVA (1-4)</label>
                                <input
                                    type="number"
                                    name="nova_group"
                                    value={formData.nova_group}
                                    onChange={handleChange}
                                    min={1}
                                    max={4}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                        </div>

                        {/* Additives */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Additifs (séparés par des virgules, ex: E330, E407)</label>
                            <textarea
                                name="additives_tags"
                                rows={4}
                                value={formData.additives_tags}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            />
                        </div>

                        {/* Nutriments */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Valeurs Nutritionnelles (pour 100g)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Calories (kcal)</label>
                                    <input
                                        type="number"
                                        name="energy-kcal_100g"
                                        value={formData.nutriments['energy-kcal_100g']}
                                        onChange={handleNutrimentChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Sucres (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="sugars_100g"
                                        value={formData.nutriments['sugars_100g']}
                                        onChange={handleNutrimentChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Sel (g)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="salt_100g"
                                        value={formData.nutriments['salt_100g']}
                                        onChange={handleNutrimentChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Graisses Saturées (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="saturated-fat_100g"
                                        value={formData.nutriments['saturated-fat_100g']}
                                        onChange={handleNutrimentChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Protéines (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="proteins_100g"
                                        value={formData.nutriments['proteins_100g']}
                                        onChange={handleNutrimentChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Fibres (g)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        name="fiber_100g"
                                        value={formData.nutriments['fiber_100g']}
                                        onChange={handleNutrimentChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500">Fruits/Légumes (%)</label>
                                    <input
                                        type="number"
                                        step="1"
                                        name="fruits-vegetables-nuts-estimate-from-ingredients_100g"
                                        value={formData.nutriments['fruits-vegetables-nuts-estimate-from-ingredients_100g']}
                                        onChange={handleNutrimentChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    />
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        form="edit-product-form"
                        disabled={loading}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? 'Validation...' : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Valider & Rescorer
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
