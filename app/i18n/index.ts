import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, I18nManager } from 'react-native';
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
  },
  en: {
    welcome: 'Welcome',
    connect: 'Sign in to get started',
    settings_language: 'Language',
    language_changed: 'Language changed',
  theme_dark: 'Dark theme',
  choose: 'Choose',
  account: 'Account',
  about: 'About',
  who_are_we: 'Who are we?',
    scan_stats_empty: 'Scan products to see your statistics.',
    your_analysis: 'Your Analysis',
    average_quality: 'Average quality of your products',
    distribution_of_scans: 'Distribution of your {count} scans',
    excellent: 'Excellent',
    good: 'Good',
    mediocre: 'Mediocre',
    bad: 'Bad',
    product_unknown: 'Unknown product',
  help_add_product: 'Help the community by adding this product to the database.',
    confirm_delete_title: 'Confirm deletion',
    confirm_delete_message: 'Do you really want to delete these items?',
    cancel: 'Cancel',
    confirm: 'Delete',
    select_all: 'Select all',
    deselect_all: 'Deselect all',
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
    
  },
  ar: {
    welcome: 'مرحبا',
    connect: 'سجّل الدخول للبدء',
    settings_language: 'اللغة',
    language_changed: 'تم تغيير اللغة',
  theme_dark: 'الوضع الداكن',
  choose: 'اختر',
  account: 'الحساب',
  about: 'حول',
  who_are_we: 'من نحن؟',
    scan_stats_empty: 'امسح المنتجات لرؤية إحصاءاتك.',
    your_analysis: 'تحليلك',
    average_quality: 'متوسط جودة منتجاتك',
    distribution_of_scans: 'توزيع عمليات المسح البالغ عددها {count}',
    excellent: 'ممتاز',
    good: 'جيد',
    mediocre: 'متوسط',
    bad: 'سيء',
    product_unknown: 'منتج غير معروف',
  help_add_product: 'ساهم بإضافة هذا المنتج إلى قاعدة البيانات.',
    confirm_delete_title: 'تأكيد الحذف',
    confirm_delete_message: 'هل تريد حقًا حذف هذه العناصر؟',
    cancel: 'إلغاء',
    confirm: 'حذف',
    select_all: 'اختيار الكل',
    deselect_all: 'إلغاء تحديد الكل',
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

  const setLanguage = async (l: SupportedLang) => {
    const previous = lang;
    await setStoredLang(l);
    currentLang = l;
    setLang(l);
    // notify other mounted hooks/components
    if (__DEV__) console.log('[i18n] setLanguage ->', l);
    notifyListeners(l);
    // Handle RTL flipping when switching to/from Arabic
    const shouldBeRTL = l === 'ar';
    try {
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
      }

      // Always try to reload the app programmatically (Expo Updates) to apply language + layout changes
      if (Updates && typeof Updates.reloadAsync === 'function') {
        await Updates.reloadAsync();
      } else {
        Alert.alert(
          translations[l]?.language_changed || 'Language changed',
          'Please restart the app to apply the new language and layout direction.'
        );
      }
    } catch (e) {
      // if any failure, just notify the user to restart
      Alert.alert('Restart required', 'Please restart the app to apply language changes.');
    }
  };

  const setFollowSystem = async (val: boolean) => {
    await setStoredFollow(val);
    followSystem = val;
    if (val) {
      const sys = detectSystemLang();
      await setStoredLang(sys);
      currentLang = sys;
      setLang(sys);
      notifyListeners(sys);
    }
    // After changing follow-system state we should ensure layout/direction is correct and reload app
    try {
      const shouldBeRTL = currentLang === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
      }
      if (Updates && typeof Updates.reloadAsync === 'function') {
        await Updates.reloadAsync();
      } else {
        Alert.alert(
          translations[currentLang]?.language_changed || 'Language changed',
          'Please restart the app to apply the new language and layout direction.'
        );
      }
    } catch (e) {
      Alert.alert('Restart required', 'Please restart the app to apply language changes.');
    }
  };

  const translate = (key: string) => {
    return translations[lang]?.[key] ?? key;
  };

  return { lang, setLanguage, setFollowSystem, follow: followSystem, t: translate };
}

export default { getStoredLang, setStoredLang, t };
