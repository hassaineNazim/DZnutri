import { api } from './axios';

export type RiskyIngredient = {
  name: string;
  danger_level: number;
  concern?: string | null;
};

export type CosmeticProduct = {
  id: number;
  barcode: string;
  product_name?: string;
  brand?: string;
  image_url?: string;
  ingredients_text?: string | null;
  category?: string | null;
  cosmetic_score?: number | null;
  score_detail?: Record<string, any> | null;
  risky_ingredients?: RiskyIngredient[];
  is_verified?: boolean;
};

// Récupère un cosmétique par code-barres (local puis Open Beauty Facts côté API).
// Retourne null si le produit est introuvable (404) -> l'app propose l'ajout.
export async function fetchCosmetic(barcode: string): Promise<CosmeticProduct | null> {
  try {
    const resp = await api.get(`/api/cosmetic/${barcode}`);
    return resp.data?.product ?? null;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}
