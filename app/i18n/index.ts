import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
// optional expo updates reload
let Updates: any = null;
try {
  Updates = require('expo-updates');
} catch (e) {
  Updates = null;
}

export type SupportedLang = 'fr' | 'en' | 'ar';
const STORAGE_KEY = 'appLang';
const STORAGE_FOLLOW = 'appLangFollowSystem';

const translations: Record<SupportedLang, Record<string, string>> = {
  fr: {
    welcome: 'Bienvenue',
    connect: 'Connectez-vous pour commencer',
    settings_language: 'Langue',
    language_changed: 'Langue changée',
    follow_system: 'Suivre la langue du système',
    signin_google: 'Se connecter avec Google',
    signin_facebook: 'Se connecter avec Facebook',
    give_camera_permission: "Donner la permission",
    camera_permission_needed: "Nous avons besoin de la permission de la caméra.",
    unknown_product: 'Produit inconnu',
    complete_info: 'Compléter les informations',
    theme_dark: 'Thème sombre',
    choose: 'Choisir',
    account: 'Compte',
    about: 'À propos',
    who_are_we: 'Qui sommes-nous ?',
    help_add_product: 'Aidez la communauté en ajoutant ce produit à la base de données.',
    confirm_delete_title: 'Confirmer la suppression',
    confirm_delete_message: 'Voulez-vous vraiment supprimer ces éléments ?',
    cancel: 'Annuler',
    confirm: 'Supprimer',
    select_all: 'Tout sélectionner',
    deselect_all: 'Tout désélectionner',
    scan_stats_empty: 'Scannez des produits pour voir vos statistiques.',
    your_analysis: 'Votre Analyse',
    average_quality: 'Qualité moyenne de vos produits',
    distribution_of_scans: 'Répartition de vos {count} scans',
    excellent: 'Excellent',
    good: 'Bon',
    mediocre: 'Médiocre',
    bad: 'Mauvais',
    product_unknown: 'Produit inconnu',
    brand_unknown: 'Marque inconnue',
    score_label: 'Score',
    add_product: 'Ajouter un produit',
    no_products_found: 'Aucun produit trouvé',
    search_products: 'Rechercher des produits',
    no_name: 'Pas de nom',
    no_brand: 'Pas de marque',
    not_available: 'N/A',
    historique: 'Historique',
    reglage: 'Réglage',
    analyse: 'Analyse',
    rech: 'Recherche',
    selected: 'sélectionné(s)',
    ago: 'il y a',
    h: 'h',
    m: 'm',
    s: 's',
    d: 'j',
    terms_privacy: "En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.",
    search_subtitle: "Trouvez des produits dans la base OpenFoodFacts",
    search_placeholder_text: "Recherchez parmi des milliers de produits alimentaires",
    history_subtitle: "Vos derniers produits scannés",
    history_empty: "Aucun historique de scan.",
    quality: "Qualités",
    defects: "Défauts",
    nutrition_facts: "Informations nutritionnelles",
    additional_info: "Informations complémentaires",
    add_product_title: "Ajouter un produit",
    step_1_title: "Catégorie",
    step_2_title: "Informations",
    step_3_title: "Photos",
    what_is_it: "De quoi s'agit-il ?",
    food_category: "Alimentation",
    food_subtitle: "Produits de la cuisine",
    cosmetics_category: "Cosmétiques",
    cosmetics_subtitle: "Produits de la salle de bain",
    other_category: "Autre produit",
    other_subtitle: "Aucune des catégories ci-dessus",
    product_details: "Détails du produit",
    barcode: "Code-barres",
    product_name: "Nom du produit",
    product_name_placeholder: "Ex: Biscuit Prince",
    brand: "Marque",
    brand_placeholder: "Ex: LU",
    next: "Suivant",
    fill_all_fields: "Veuillez remplir le nom et la marque du produit.",
    take_photo_front: "Photo de l'avant",
    take_photo_ingredients: "Photo de l'arrière",
    submit_product: "Soumettre le produit",
    photo_error: "Veuillez prendre les deux photos du produit.",
    success_title: "Succès !",
    success_message: "Produit soumis pour validation. Merci !",
    retake_photo: "Reprendre la photo",
    photo_instruction_front: "Prenez une photo claire de la face avant du produit. Assurez-vous que le nom et la marque sont lisibles.",
    photo_instruction_back: "Prenez une photo claire de l'arrière du produit. Le tableau nutritionnel et la liste des ingrédients doivent être lisibles.",
    open_camera: "Ouvrir la caméra",
    take_photo: "Prendre la photo",
    settings_description: "Personnalisez votre expérience",
    create_account: "Créer un compte",
    signin: "Se connecter",
    signin_email: "Se connecter avec email",
    forgot_password: "Mot de passe oublié",
    have_code: "J'ai un code",
    enter_email_reset: "Entrez votre email pour réinitialiser votre mot de passe",
    send_link: "Envoyer le lien",
    welcome_back: "Bienvenue de retour",
    join_community: "Rejoignez la communauté",
    confirm_password: "Confirmer le mot de passe",




  },
  en: {
    welcome: 'Welcome',
    connect: 'Sign in to get started',
    settings_language: 'Language',
    language_changed: 'Language changed',
    follow_system: 'Follow system language',
    signin_google: 'Sign in with Google',
    signin_facebook: 'Sign in with Facebook',
    give_camera_permission: "Give permission",
    camera_permission_needed: "We need camera permission.",
    unknown_product: 'Unknown product',
    complete_info: 'Complete info',
    theme_dark: 'Dark theme',
    choose: 'Choose',
    account: 'Account',
    about: 'About',
    who_are_we: 'Who are we?',
    help_add_product: 'Help the community by adding this product to the database.',
    confirm_delete_title: 'Confirm deletion',
    confirm_delete_message: 'Do you really want to delete these items?',
    cancel: 'Cancel',
    confirm: 'Delete',
    select_all: 'Select all',
    deselect_all: 'Deselect all',
    scan_stats_empty: 'Scan products to see your statistics.',
    your_analysis: 'Your Analysis',
    average_quality: 'Average quality of your products',
    distribution_of_scans: 'Distribution of your {count} scans',
    excellent: 'Excellent',
    good: 'Good',
    mediocre: 'Mediocre',
    bad: 'Bad',
    product_unknown: 'Unknown product',
    brand_unknown: 'Unknown brand',
    score_label: 'Score',
    add_product: 'Add Product',
    no_products_found: 'No products found',
    search_products: 'Search products',
    no_name: 'No name',
    no_brand: 'No brand',
    not_available: 'N/A',
    historique: 'History',
    reglage: 'Settings',
    analyse: 'Analysis',
    rech: 'Search',
    selected: 'selected',
    ago: 'ago',
    h: 'h',
    m: 'm',
    s: 's',
    d: 'd',
    terms_privacy: "By continuing, you agree to our Terms of Service and Privacy Policy.",
    search_subtitle: "Find products in the OpenFoodFacts database",
    search_placeholder_text: "Search among thousands of food products",
    history_subtitle: "Your recently scanned products",
    history_empty: "No scan history.",
    quality: "Qualities",
    defects: "Defects",
    nutrition_facts: "Nutrition Facts",
    additional_info: "Additional Information",
    add_product_title: "Add Product",
    step_1_title: "Category",
    step_2_title: "Information",
    step_3_title: "Photos",
    what_is_it: "What is it?",
    food_category: "Food",
    food_subtitle: "Kitchen products",
    cosmetics_category: "Cosmetics",
    cosmetics_subtitle: "Bathroom products",
    other_category: "Other product",
    other_subtitle: "None of the above",
    product_details: "Product Details",
    barcode: "Barcode",
    product_name: "Product Name",
    product_name_placeholder: "Ex: Prince Biscuit",
    brand: "Brand",
    brand_placeholder: "Ex: LU",
    next: "Next",
    fill_all_fields: "Please fill in the product name and brand.",
    take_photo_front: "Front Photo",
    take_photo_ingredients: "Back Photo",
    submit_product: "Submit Product",
    photo_error: "Please take both photos of the product.",
    success_title: "Success!",
    success_message: "Product submitted for validation. Thank you!",
    retake_photo: "Retake photo",
    take_photo: "Take photo",
    photo_instruction_front: "Take a clear photo of the front of the product. Make sure the name and brand are readable.",
    photo_instruction_back: "Take a clear photo of the back of the product. The nutrition table and ingredients list must be readable.",
    open_camera: "Open Camera",
    settings_description: "Customize your experience",
    create_account: "Create Account",
    signin: "Sign In",
    signin_email: "Sign In with Email",
    forgot_password: "Forgot Password",
    have_code: "I have a code",
    enter_email_reset: "Enter your email to reset your password",
    send_link: "Send Link",
    confirm_password: 'Confirm Password'


  },
  ar: {
    welcome: 'مرحبا',
    connect: 'سجّل الدخول للبدء',
    settings_language: 'اللغة',
    language_changed: 'تم تغيير اللغة',
    follow_system: 'اتبع لغة النظام',
    signin_google: 'تسجيل الدخول عبر جوجل',
    signin_facebook: 'تسجيل الدخول عبر فيسبوك',
    give_camera_permission: "إعطاء الإذن",
    camera_permission_needed: "نحن بحاجة إلى إذن الكاميرا.",
    unknown_product: 'منتج غير معروف',
    complete_info: 'إكمال المعلومات',
    theme_dark: 'الوضع الداكن',
    choose: 'اختر',
    account: 'الحساب',
    about: 'حول',
    who_are_we: 'من نحن؟',
    help_add_product: 'ساهم بإضافة هذا المنتج إلى قاعدة البيانات.',
    confirm_delete_title: 'تأكيد الحذف',
    confirm_delete_message: 'هل تريد حقًا حذف هذه العناصر؟',
    cancel: 'إلغاء',
    confirm: 'حذف',
    select_all: 'اختيار الكل',
    deselect_all: 'إلغاء تحديد الكل',
    scan_stats_empty: 'امسح المنتجات لرؤية إحصاءاتك.',
    your_analysis: 'تحليلك',
    average_quality: 'متوسط جودة منتجاتك',
    distribution_of_scans: 'توزيع عمليات المسح البالغ عددها {count}',
    excellent: 'ممتاز',
    good: 'جيد',
    mediocre: 'متوسط',
    bad: 'سيء',
    product_unknown: 'منتج غير معروف',
    brand_unknown: 'ماركة غير معروفة',
    score_label: 'الدرجة',
    add_product: 'أضف منتجًا',
    no_products_found: 'لم يتم العثور على منتجات',
    search_products: 'ابحث عن منتجات',
    no_name: 'لا اسم',
    no_brand: 'لا ماركة',
    not_available: 'غير متوفر',
    historique: 'سجل',
    reglage: 'الإعدادات',
    analyse: 'التحليل',
    rech: 'بحث',
    selected: 'محدد',
    ago: 'منذ',
    h: 'س',
    m: 'د',
    s: 'ث',
    d: 'ي',
    terms_privacy: "بالمتابعة، فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.",
    search_subtitle: "اعثر على المنتجات في قاعدة بيانات OpenFoodFacts",
    search_placeholder_text: "ابحث بين آلاف المنتجات الغذائية",
    history_subtitle: "آخر المنتجات التي قمت بمسحها",
    history_empty: "لا يوجد سجل مسح.",
    quality: "الصفات",
    defects: "العيوب",
    nutrition_facts: "حقائق غذائية",
    additional_info: "معلومات إضافية",
    add_product_title: "أضف منتجًا",
    step_1_title: "الفئة",
    step_2_title: "معلومات",
    step_3_title: "صور",
    what_is_it: "ما هذا؟",
    food_category: "طعام",
    food_subtitle: "منتجات المطبخ",
    cosmetics_category: "مستحضرات تجميل",
    cosmetics_subtitle: "منتجات الحمام",
    other_category: "منتج آخر",
    other_subtitle: "لا شيء مما سبق",
    product_details: "تفاصيل المنتج",
    barcode: "الباركود",
    product_name: "اسم المنتج",
    product_name_placeholder: "مثال: بسكويت برينس",
    brand: "العلامة التجارية",
    brand_placeholder: "مثال: LU",
    next: "التالي",
    fill_all_fields: "يرجى ملء اسم المنتج والعلامة التجارية.",
    take_photo_front: "صورة أمامية",
    take_photo_ingredients: "صورة الخلفية",
    submit_product: "إرسال المنتج",
    photo_error: "يرجى التقاط كلتا الصورتين للمنتج.",
    success_title: "نجاح!",
    success_message: "تم إرسال المنتج للتحقق. شكرا لك!",
    retake_photo: "إعادة التقاط الصورة",
    photo_instruction_front: "التقط صورة واضحة للجزء الأمامي من المنتج. تأكد من أن الاسم والعلامة التجارية مقروءان.",
    photo_instruction_back: "التقط صورة واضحة للجزء الخلفي من المنتج. يجب أن يكون الجدول الغذائي وقائمة المكونات مقروءة.",
    open_camera: "فتح الكاميرا",
    take_photo: "التقط الصورة",
    settings_description: "تجربتك الخاصة",
    welcome_back: "مرحبا بك مجددًا",
    signin: "تسجيل الدخول",
    create_account: "إنشاء حساب",
    signin_email: "تسجيل الدخول عبر البريد الإلكتروني",
    forgot_password: "نسيت كلمة المرور",
    have_code: "أملك رمز",
    enter_email_reset: "أدخل بريدك الإلكتروني لاستعادة كلمة المرور",
    send_link: "إرسال رابط",
    confirm_password: "تأكيد كلمة المرور",




  }
};

let currentLang: SupportedLang = 'fr';
let followSystem: boolean = true;
const listeners: Array<(lang: SupportedLang) => void> = [];

let reactNativeLocalize: any = null;
try {
  reactNativeLocalize = require('react-native-localize');
} catch (e) {
  reactNativeLocalize = null;
}

function detectSystemLang(): SupportedLang {
  try {
    if (reactNativeLocalize && typeof reactNativeLocalize.getLocales === 'function') {
      const locales = reactNativeLocalize.getLocales();
      if (locales && locales.length > 0) {
        const code = locales[0].languageCode;
        if (code === 'ar') return 'ar';
        if (code === 'en') return 'en';
        return 'fr';
      }
    }
    if (typeof navigator !== 'undefined' && (navigator as any).language) {
      const code = ((navigator as any).language as string).split('-')[0];
      if (code === 'ar') return 'ar';
      if (code === 'en') return 'en';
      return 'fr';
    }
  } catch (e) {
    // ignore
  }
  return 'fr';
}

function notifyListeners(l: SupportedLang) {
  if (__DEV__) console.log('[i18n] notifyListeners ->', l);
  listeners.forEach((cb) => {
    try { cb(l); } catch (e) { /* ignore */ }
  });
}

export function subscribe(cb: (lang: SupportedLang) => void) {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export async function getStoredLang(): Promise<SupportedLang> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'ar' || v === 'fr') return v;
  } catch (e) {
    // ignore
  }
  return 'fr';
}

export async function getStoredFollow(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_FOLLOW);
    if (v === null) return true; // default to follow system
    return v === '1' || v === 'true';
  } catch (e) {
    return true;
  }
}

export async function setStoredFollow(val: boolean) {
  followSystem = val;
  try {
    await AsyncStorage.setItem(STORAGE_FOLLOW, val ? '1' : '0');
  } catch (e) {
    // ignore
  }
}

export async function setStoredLang(lang: SupportedLang) {
  currentLang = lang;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {
    // ignore
  }
}

export function t(key: string): string {
  return translations[currentLang]?.[key] ?? key;
}

export function useTranslation() {
  const [lang, setLang] = useState<SupportedLang>(currentLang);

  useEffect(() => {
    let mounted = true;
    Promise.all([getStoredLang(), getStoredFollow()]).then(([l, f]) => {
      if (mounted) {
        followSystem = f;
        if (f) {
          const sys = detectSystemLang();
          currentLang = sys;
        } else {
          currentLang = l;
        }
        setLang(currentLang);
      }
    });
    // subscribe to external changes
    const unsubscribe = subscribe((l) => {
      if (__DEV__) console.log('[i18n] subscriber callback ->', l);
      if (mounted) setLang(l);
    });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  const setLanguage = async (l: SupportedLang): Promise<{ needsRestart: boolean }> => {
    const previous = lang;
    await setStoredLang(l);
    currentLang = l;
    setLang(l);
    // notify other mounted hooks/components
    if (__DEV__) console.log('[i18n] setLanguage ->', l);
    notifyListeners(l);

    // Handle RTL flipping when switching to/from Arabic
    const shouldBeRTL = l === 'ar';
    const needsRestart = I18nManager.isRTL !== shouldBeRTL;

    try {
      if (needsRestart) {
        I18nManager.forceRTL(shouldBeRTL);
      }

      // Always try to reload the app programmatically (Expo Updates) to apply language + layout changes
      if (Updates && typeof Updates.reloadAsync === 'function') {
        await Updates.reloadAsync();
        return { needsRestart: false }; // Reload happened/is happening
      }

      // Fallback for Dev Client / Expo Go if Updates is not available
      // We avoid DevSettings.reload() because it can feel like a crash or exit
      // Instead we return { needsRestart: true } and let the UI show the manual restart modal

      return { needsRestart };
    } catch (e) {
      return { needsRestart: true };
    }
  };

  const setFollowSystem = async (val: boolean): Promise<{ needsRestart: boolean }> => {
    await setStoredFollow(val);
    followSystem = val;
    let needsRestart = false;

    if (val) {
      const sys = detectSystemLang();
      await setStoredLang(sys);
      currentLang = sys;
      setLang(sys);
      notifyListeners(sys);

      const shouldBeRTL = sys === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
        needsRestart = true;
      }
    }

    // After changing follow-system state we should ensure layout/direction is correct and reload app
    try {
      if (Updates && typeof Updates.reloadAsync === 'function') {
        await Updates.reloadAsync();
        return { needsRestart: false };
      }

      // We avoid DevSettings.reload() because it can feel like a crash or exit
      // Instead we return { needsRestart: true } and let the UI show the manual restart modal

      return { needsRestart };
    } catch (e) {
      return { needsRestart: true };
    }
  };

  const translate = (key: string) => {
    return translations[lang]?.[key] ?? key;
  };

  return { lang, setLanguage, setFollowSystem, follow: followSystem, t: translate };
}

export default { getStoredLang, setStoredLang, t };
