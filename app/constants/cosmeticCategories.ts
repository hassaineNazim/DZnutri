import type { SupportedLang } from '../i18n';

export type CosmeticCategory = {
  value: string;
  labels: Record<SupportedLang, string>;
};

// Valeurs stables enregistrées en base, avec libellés traduits côté interface.
export const COSMETIC_CATEGORIES: CosmeticCategory[] = [
  { value: 'shampoo', labels: { fr: 'Shampooing', en: 'Shampoo', ar: 'شامبو' } },
  { value: 'conditioner_hair_mask', labels: { fr: 'Après-shampooing / masque capillaire', en: 'Conditioner / hair mask', ar: 'بلسم / قناع للشعر' } },
  { value: 'scalp_care', labels: { fr: 'Soin du cuir chevelu', en: 'Scalp care', ar: 'عناية بفروة الرأس' } },
  { value: 'hair_styling', labels: { fr: 'Coiffage / fixation', en: 'Hair styling / hold', ar: 'تصفيف وتثبيت الشعر' } },
  { value: 'hair_colour_bleach', labels: { fr: 'Coloration / décoloration capillaire', en: 'Hair colour / bleach', ar: 'صبغة / تفتيح الشعر' } },
  { value: 'face_cleanser', labels: { fr: 'Nettoyant visage', en: 'Face cleanser', ar: 'منظف الوجه' } },
  { value: 'face_moisturiser', labels: { fr: 'Hydratant / soin du visage', en: 'Face moisturiser / care', ar: 'مرطب / عناية بالوجه' } },
  { value: 'face_serum_oil', labels: { fr: 'Sérum / huile visage', en: 'Face serum / oil', ar: 'سيروم / زيت للوجه' } },
  { value: 'face_mask_scrub', labels: { fr: 'Masque / gommage visage', en: 'Face mask / scrub', ar: 'قناع / مقشر للوجه' } },
  { value: 'brightening_anti_spot', labels: { fr: 'Soin éclaircissant / anti-taches', en: 'Brightening / anti-dark-spot care', ar: 'عناية بالتفتيح / مضادة للبقع' } },
  { value: 'complexion_makeup', labels: { fr: 'Maquillage du teint', en: 'Complexion makeup', ar: 'مكياج البشرة' } },
  { value: 'eye_makeup', labels: { fr: 'Maquillage des yeux', en: 'Eye makeup', ar: 'مكياج العيون' } },
  { value: 'lip_makeup', labels: { fr: 'Maquillage des lèvres', en: 'Lip makeup', ar: 'مكياج الشفاه' } },
  { value: 'makeup_remover', labels: { fr: 'Démaquillant', en: 'Makeup remover', ar: 'مزيل المكياج' } },
  { value: 'soap_shower_gel', labels: { fr: 'Savon / gel douche', en: 'Soap / shower gel', ar: 'صابون / جل الاستحمام' } },
  { value: 'bath_product', labels: { fr: 'Produit pour le bain / sels de bain', en: 'Bath product / bath salts', ar: 'منتج للاستحمام / أملاح الحمام' } },
  { value: 'body_care', labels: { fr: 'Soin du corps', en: 'Body care', ar: 'عناية بالجسم' } },
  { value: 'body_powder', labels: { fr: 'Talc / poudre corporelle', en: 'Talc / body powder', ar: 'بودرة التلك / بودرة الجسم' } },
  { value: 'deodorant_antiperspirant', labels: { fr: 'Déodorant / anti-transpirant', en: 'Deodorant / antiperspirant', ar: 'مزيل العرق / مضاد التعرق' } },
  { value: 'intimate_hygiene', labels: { fr: 'Hygiène intime', en: 'Intimate hygiene', ar: 'العناية بالنظافة الحميمة' } },
  { value: 'shaving_aftershave', labels: { fr: 'Rasage / après-rasage', en: 'Shaving / aftershave', ar: 'الحلاقة / ما بعد الحلاقة' } },
  { value: 'hair_removal', labels: { fr: 'Produit dépilatoire / épilation', en: 'Hair removal product', ar: 'منتج إزالة الشعر' } },
  { value: 'perfume_fragrance', labels: { fr: 'Parfum / eau de toilette', en: 'Perfume / fragrance', ar: 'عطر / ماء تواليت' } },
  { value: 'sunscreen', labels: { fr: 'Protection solaire', en: 'Sunscreen', ar: 'واقي الشمس' } },
  { value: 'after_sun', labels: { fr: 'Après-soleil', en: 'After-sun care', ar: 'عناية ما بعد الشمس' } },
  { value: 'self_tanner', labels: { fr: 'Autobronzant', en: 'Self-tanner', ar: 'مستحضر التسمير الذاتي' } },
  { value: 'hand_care', labels: { fr: 'Soin des mains', en: 'Hand care', ar: 'عناية باليدين' } },
  { value: 'foot_care', labels: { fr: 'Soin des pieds', en: 'Foot care', ar: 'عناية بالقدمين' } },
  { value: 'nail_care_polish', labels: { fr: 'Soin des ongles / vernis', en: 'Nail care / polish', ar: 'عناية بالأظافر / طلاء الأظافر' } },
  { value: 'nail_polish_remover', labels: { fr: 'Dissolvant', en: 'Nail polish remover', ar: 'مزيل طلاء الأظافر' } },
  { value: 'oral_hygiene', labels: { fr: 'Hygiène bucco-dentaire', en: 'Oral hygiene', ar: 'العناية بالفم والأسنان' } },
  { value: 'baby_child_care', labels: { fr: 'Produit pour bébé / enfant', en: 'Baby / child care', ar: 'منتج للعناية بالرضع / الأطفال' } },
  { value: 'other_cosmetic', labels: { fr: 'Autre cosmétique', en: 'Other cosmetic', ar: 'مستحضر تجميل آخر' } },
];

export function getCosmeticCategoryLabel(value: string | null | undefined, lang: SupportedLang): string {
  if (!value) return '';
  return COSMETIC_CATEGORIES.find((category) => category.value === value)?.labels[lang] ?? value;
}
