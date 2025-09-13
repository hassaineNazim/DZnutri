import { api } from './axios';

type Product = {
  id: number; 
  product_name?: string;
  nutrition_grades?: string; 
  brands?: string;
  image_url?: string;
  custom_score?: number;
};

export const saveToHistory = async (product: Product): Promise<void> => {
  if (!product || !product.id) {
    console.log("Tentative de sauvegarde d'un produit invalide. Annulation.");
    return;
  }
  
  try {
    await api.post(`/api/history/${product.id}`);
    console.log(`Produit avec id ${product.id} sauvegardé dans l'historique.`);
  } catch (error) {
    console.error("Échec de la sauvegarde de l'historique sur le serveur:", error);
  }
};


export const fetchHistory = async (): Promise<Product[]> => {
  try {
    const response = await api.get('/api/history');
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error);
    return []; 
  }
};

export const deleteFromHistory = async (itemId: number) => {
  try {
    await api.delete(`/api/history/product/${itemId}`);
  } catch (error) {
    console.error("Échec de la suppression de l'historique:", error);
    throw error; 
  }
};