// Mapping des identifiants du profil santé vers les termes réellement
// rencontrés sur les étiquettes françaises, anglaises et arabes.
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  gluten: [
    'gluten', 'blé', 'ble', 'orge', 'seigle', 'avoine', 'froment', 'kamut',
    'épeautre', 'epeautre', 'wheat', 'barley', 'rye', 'oat', 'قمح', 'غلوتين',
    'جلوتين', 'شعير', 'شوفان', 'جاودار',
  ],
  peanuts: [
    'arachide', 'arachides', 'cacahuète', 'cacahuetes', 'cacahuete',
    'peanut', 'peanuts', 'فول سوداني', 'الفول السوداني', 'كاوكاو',
  ],
  lactose: [
    'lait', 'laitier', 'laitière', 'laitiere', 'milk', 'lactose', 'crème',
    'creme', 'beurre', 'butter', 'fromage', 'cheese', 'yaourt', 'yogurt',
    'lactérum', 'lacterum', 'caséine', 'caseine', 'petit-lait', 'whey',
    'حليب', 'لبن', 'زبدة', 'جبن', 'قشدة', 'لاكتوز', 'كازين',
  ],
  eggs: [
    'œuf', 'oeuf', 'œufs', 'oeufs', 'egg', 'eggs', "blanc d'œuf",
    "jaune d'œuf", 'albumine', 'بيض', 'زلال البيض', 'صفار البيض',
  ],
  soy: ['soja', 'soya', 'soy', 'soybean', 'صويا', 'فول الصويا'],
  fish: [
    'poisson', 'fish', 'thon', 'tuna', 'saumon', 'salmon', 'cabillaud',
    'cod', 'morue', 'سمك', 'أسماك', 'تونة', 'سلمون',
  ],
  shellfish: [
    'crustacé', 'crustace', 'crustacés', 'shellfish', 'crevette', 'shrimp',
    'prawn', 'crabe', 'crab', 'homard', 'lobster', 'moule', 'mussel',
    'huître', 'huitre', 'oyster', 'mollusque', 'قشريات', 'روبيان', 'جمبري',
    'سرطان البحر', 'محار', 'رخويات',
  ],
  nuts: [
    'fruit à coque', 'fruit a coque', 'fruits à coque', 'fruits a coque',
    'tree nut', 'tree nuts', 'amande', 'almond', 'noisette', 'hazelnut',
    'noix', 'walnut', 'cajou', 'cashew', 'pistache', 'pistachio',
    'macadamia', 'pécan', 'pecan', 'مكسرات', 'لوز', 'بندق', 'جوز',
    'كاجو', 'فستق',
  ],
  celery: [
    'céleri', 'celeri', 'celery', 'céleri-rave', 'celeri-rave',
    'كرفس', 'الكرفس',
  ],
  mustard: ['moutarde', 'mustard', 'خردل', 'الخردل'],
  sesame: [
    'sésame', 'sesame', 'tahini', 'tahin', 'سمسم', 'السمسم', 'طحينة',
  ],
  lupin: ['lupin', 'lupine', 'ترمس', 'الترمس'],
  sulphites: [
    'sulfite', 'sulfites', 'sulphite', 'sulphites', 'dioxyde de soufre',
    'sulfur dioxide', 'sulphur dioxide', 'e220', 'e221', 'e222', 'e223',
    'e224', 'e225', 'e226', 'e227', 'e228', 'كبريتيت',
    'ثاني أكسيد الكبريت', 'سلفيت',
  ],
};

export function normalizeIngredientText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[\u0640\u064B-\u065F\u0670]/gu, '')
    .toLocaleLowerCase();
}

export function containsWholeTerm(normalizedText: string, keyword: string): boolean {
  const normalizedKeyword = normalizeIngredientText(keyword).trim();
  if (!normalizedKeyword) return false;
  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `(?:^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`,
    'u',
  ).test(normalizedText);
}

export function detectAllergens(
  ingredientsText: string,
  allergyIds: string[],
): string[] {
  if (!ingredientsText || allergyIds.length === 0) return [];
  const normalizedText = normalizeIngredientText(ingredientsText);

  return allergyIds.filter((allergyId) =>
    ALLERGEN_KEYWORDS[allergyId]?.some((keyword) =>
      containsWholeTerm(normalizedText, keyword),
    ),
  );
}
