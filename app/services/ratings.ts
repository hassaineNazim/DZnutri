import { api } from './axios';

export type RatingItem = {
  username?: string | null;
  rating: number;
  comment?: string | null;
  created_at?: string | null;
};

export type RatingsSummary = {
  average: number | null;
  count: number;
  my_rating: number | null;
  my_comment: string | null;
  ratings: RatingItem[];
};

// Résumé des notes d'un produit (moyenne, nombre, ma note, avis récents).
export async function getRatings(barcode: string): Promise<RatingsSummary> {
  const resp = await api.get(`/api/product/${barcode}/ratings`);
  return resp.data;
}

// (Re)noter un produit. Renvoie le résumé mis à jour.
export async function submitRating(
  barcode: string,
  rating: number,
  comment?: string,
): Promise<RatingsSummary> {
  const resp = await api.post(`/api/product/${barcode}/ratings`, {
    rating,
    comment: comment?.trim() || null,
  });
  return resp.data;
}
