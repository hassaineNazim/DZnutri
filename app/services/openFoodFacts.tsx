
import { API_URL } from "../config/api";

export const fetchProduct = async (barcode: string) => {
  try {
    const response = await fetch(`${API_URL}/api/product/${barcode}`);

    // 1. Vérifier si la requête a réussi (ex: status 200 OK)
    // Si le backend renvoie 404 (non trouvé), cette condition sera fausse
    if (!response.ok) {
      // On récupère le message d'erreur du backend s'il existe
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Produit non trouvé');
    }

    // 2. Si la requête a réussi, on extrait les données
    const data = await response.json();

    // 3. On renvoie directement l'objet "product" qui est à l'intérieur
    // Notre backend garantit que si la réponse est OK, "product" existe.
    return data.product;

  } catch (error) {
    console.error("Erreur dans fetchProduct:", error);
    // On propage l'erreur pour que le composant qui appelle puisse la gérer
    throw error;
  }
};