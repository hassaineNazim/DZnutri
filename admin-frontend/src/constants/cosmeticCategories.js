export const COSMETIC_CATEGORY_OPTIONS = [
  ['shampoo', 'Shampooing'],
  ['conditioner_hair_mask', 'Après-shampooing / masque capillaire'],
  ['scalp_care', 'Soin du cuir chevelu'],
  ['hair_styling', 'Coiffage / fixation'],
  ['hair_colour_bleach', 'Coloration / décoloration capillaire'],
  ['face_cleanser', 'Nettoyant visage'],
  ['face_moisturiser', 'Hydratant / soin du visage'],
  ['face_serum_oil', 'Sérum / huile visage'],
  ['face_mask_scrub', 'Masque / gommage visage'],
  ['brightening_anti_spot', 'Soin éclaircissant / anti-taches'],
  ['complexion_makeup', 'Maquillage du teint'],
  ['eye_makeup', 'Maquillage des yeux'],
  ['lip_makeup', 'Maquillage des lèvres'],
  ['makeup_remover', 'Démaquillant'],
  ['soap_shower_gel', 'Savon / gel douche'],
  ['bath_product', 'Produit pour le bain / sels de bain'],
  ['body_care', 'Soin du corps'],
  ['body_powder', 'Talc / poudre corporelle'],
  ['deodorant_antiperspirant', 'Déodorant / anti-transpirant'],
  ['intimate_hygiene', 'Hygiène intime'],
  ['shaving_aftershave', 'Rasage / après-rasage'],
  ['hair_removal', 'Produit dépilatoire / épilation'],
  ['perfume_fragrance', 'Parfum / eau de toilette'],
  ['sunscreen', 'Protection solaire'],
  ['after_sun', 'Après-soleil'],
  ['self_tanner', 'Autobronzant'],
  ['hand_care', 'Soin des mains'],
  ['foot_care', 'Soin des pieds'],
  ['nail_care_polish', 'Soin des ongles / vernis'],
  ['nail_polish_remover', 'Dissolvant'],
  ['oral_hygiene', 'Hygiène bucco-dentaire'],
  ['baby_child_care', 'Produit pour bébé / enfant'],
  ['other_cosmetic', 'Autre cosmétique'],
].map(([value, label]) => ({ value, label }));

export function getCosmeticCategoryLabel(value) {
  if (!value) return '';
  return COSMETIC_CATEGORY_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function optionsWithLegacyValue(value) {
  if (!value || COSMETIC_CATEGORY_OPTIONS.some((option) => option.value === value)) {
    return COSMETIC_CATEGORY_OPTIONS;
  }
  return [{ value, label: `${value} (ancienne valeur)` }, ...COSMETIC_CATEGORY_OPTIONS];
}
