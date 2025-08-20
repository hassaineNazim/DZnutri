
import { API_URL } from "../config/api";

export const fetchProduct = async (barcode: string) => {
  try {
    const response = await fetch(`${API_URL}/api/product/${barcode}`);
    const data = await response.json();

    if (!response.ok || !data.product) {
      console.error("Produit introuvable");
      return null; // 🔥 renvoie null si le produit n’existe pas
    }
    console.log(data.product);
    return data.product;
  } catch (error) {
    console.error("Erreur dans fetchProduct:", error);
    return null; // 🔥 mieux que throw, sinon ton app crashe
  }
};