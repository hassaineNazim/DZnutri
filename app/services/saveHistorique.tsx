import { api } from './axios';

type Product = {
  id: number;
  item_type?: 'food' | 'cosmetic';
  product_name?: string;
  nutrition_grades?: string;
  brands?: string;
  image_url?: string;
  custom_score?: number;
  scanned_at?: string | null;
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
  const response = await api.get('/api/history');
  // Une réponse inattendue ne doit pas faire tomber tout l'écran au moment où
  // celui-ci appelle filter/map. Le backend renvoie normalement un tableau.
  return Array.isArray(response.data) ? response.data : [];
};

export const deleteFromHistory = async (itemId: number) => {
  try {
    await api.delete(`/api/history/product/${itemId}`);
  } catch (error) {
    console.error("Échec de la suppression de l'historique:", error);
    throw error;
  }
};

// --- Univers cosmétique (historique mixte) ---

export const saveCosmeticToHistory = async (cosmeticId?: number): Promise<void> => {
  if (!cosmeticId) return;
  try {
    await api.post(`/api/history/cosmetic/${cosmeticId}`);
  } catch (error) {
    console.error("Échec de la sauvegarde de l'historique cosmétique:", error);
  }
};

export const deleteCosmeticFromHistory = async (cosmeticId: number) => {
  try {
    await api.delete(`/api/history/cosmetic/${cosmeticId}`);
  } catch (error) {
    console.error("Échec de la suppression de l'historique cosmétique:", error);
    throw error;
  }
};

export const fetchHistoryStats = async () => {
  try {
    const response = await api.get('/api/history/stats');
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return null;
  }
};
