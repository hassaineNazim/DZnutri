import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
// optional expo updates reload
let Updates: any = null;
try {
  Updates = require('expo-updates');
} catch {
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
    food: 'Aliment',
    cosmetic: 'Cosmétique',
    scan_food_hint: 'Scannez le code-barres d\'un aliment',
    scan_cosmetic_hint: 'Scannez le code-barres d\'un cosmétique',
    cosmetic_score_label: 'Score cosmétique',
    analysis_unavailable: 'Analyse indisponible',
    risky_ingredients: 'Ingrédients à risque',
    no_risky_ingredients: 'Aucun ingrédient préoccupant détecté.',
    composition_not_analyzed: 'Composition non analysée.',
    composition_inci: 'Composition (INCI)',
    risk_high: 'Risque élevé',
    risk_moderate: 'Risque modéré',
    risk_low: 'Risque faible',
    add_cosmetic_title: 'Ajouter un cosmétique',
    barcode_label: 'Code-barres',
    front_face: 'Face avant',
    back_inci: 'Dos (INCI)',
    the_product: 'Le produit',
    ingredients_list: "Liste d'ingrédients",
    product_name_optional: 'Nom du produit (optionnel)',
    brand_optional: 'Marque (optionnel)',
    category_optional: 'Catégorie (ex: soin visage) — optionnel',
    send_for_validation: 'Envoyer pour validation',
    front_photo_required: 'La photo avant est requise',
    cosmetic_submitted: 'Merci ! Cosmétique envoyé pour validation.',
    user_ratings: 'Notes des utilisateurs',
    reviews: 'avis',
    no_ratings_yet: 'Aucune note pour le moment',
    rate_this_product: 'Notez ce produit',
    your_rating: 'Votre note',
    your_review_placeholder: 'Votre avis (optionnel)',
    send_my_rating: 'Envoyer ma note',
    update_my_rating: 'Mettre à jour ma note',
    recent_reviews: 'Avis récents',
    rating_thanks: 'Merci pour votre note !',
    choose_rating: 'Choisissez une note (1 à 5 étoiles)',
    user_fallback: 'Utilisateur',
    complete_info: 'Compléter les informations',
    theme_dark: 'Thème sombre',
    choose: 'Choisir',
    account: 'Compte',
    about: 'À propos',
    who_are_we: 'Qui sommes-nous ?',
    privacy_policy: 'Politique de confidentialité',
    terms_of_service: "Conditions d'utilisation",
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
    mediocre: 'Moyen',
    bad: 'Mauvais',
    today: "Aujourd'hui",
    yesterday: 'Hier',
    earlier: 'Plus tôt',
    scans: 'SCANS',
    avg_score: 'SCORE MOY.',
    alerts: 'ALERTES',
    scan: 'Scanner',
    a_problem: 'Un problème ?',
    home: 'Accueil',
    search: 'Rechercher',
    carnet: 'Carnet',
    me: 'Moi',
    scan_in_progress: 'Scan en cours',
    scan_frame_title: 'Cadrez le code-barres',
    product_detected: 'Produit détecté',
    add_in_30s: 'Ajoutez-le à la base en 30 s.',
    product_not_found_q: 'Produit introuvable ?',
    add: 'Ajouter',
    additives: 'Additifs',
    detected: 'détectés',
    risk: 'Risque',
    safe: 'Sûr',
    no_additives: 'Aucun additif à déclarer.',
    nutritional_info: 'Informations nutritionnelles',
    energy: 'Énergie',
    carbs: 'Glucides',
    sat_fat: 'Gras saturés',
    fiber: 'Fibres',
    salt: 'Sel',
    report: 'BILAN',
    your_report: 'Votre bilan.',
    grade: 'Note',
    products_scanned: 'produits scannés',
    report_good: 'Continuez comme ça, vos choix sont sains.',
    report_improve: 'Quelques produits à surveiller ce mois-ci.',
    distribution: 'Répartition',
    by_quality: 'par qualité',
    skip: 'PASSER',
    onboarding_title_1: 'Manger mieux, ',
    onboarding_title_2: 'scan par scan.',
    onboarding_subtitle: "Décryptez les étiquettes des produits algériens en un clin d'œil.",
    start: 'Commencer',
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
    take_photo_nutrition: "Tableau nutritionnel",
    submit_product: "Soumettre le produit",
    photo_error: "Veuillez prendre les deux photos du produit.",
    success_title: "Succès !",
    success_message: "Produit soumis pour validation. Merci !",
    retake_photo: "Reprendre la photo",
    photo_instruction_front: "Prenez une photo claire de la face avant du produit. Assurez-vous que le nom et la marque sont lisibles.",
    photo_instruction_back: "Prenez une photo claire de l'arrière du produit. Le tableau nutritionnel et la liste des ingrédients doivent être lisibles.",
    photo_instruction_nutrition: "Prenez une photo claire du tableau des valeurs nutritionnelles.",
    open_camera: "Ouvrir la caméra",
    take_photo: "Prendre la photo",
    settings_description: "Personnalisez votre expérience",
    create_account: "Créer un compte",
    // --- Redesign v2 : Connexion / Réglages / Signalement ---
    signin_title: 'Manger mieux,',
    signin_accent: 'ça commence ici.',
    signin_subtitle: 'Connectez-vous pour commencer à scanner.',
    continue_google: 'Continuer avec Google',
    continue_facebook: 'Continuer avec Facebook',
    continue_email: 'Continuer avec e-mail',
    no_account: 'Pas encore de compte ?',
    my_account: 'Mon compte',
    settings_title: 'Réglages',
    preferences: 'Préférences',
    favorites: 'Favoris',
    report_error_title: 'Signaler une erreur',
    report_error_why: 'Pourquoi le score de ce produit',
    report_error_why_end: 'vous semble-t-il incorrect ?',
    report_placeholder: 'Ex : les calories sont fausses…',
    send_report: 'Envoyer le signalement',
    close_cancel: 'Fermer / Annuler',
    report_empty: 'Veuillez décrire le problème.',
    report_thanks: 'Merci !',
    report_sent: "Votre signalement a été envoyé à l'équipe.",
    report_failed: "Impossible d'envoyer le signalement.",
    error: 'Erreur',
    oops: 'Oups',
    signin: "Se connecter",
    signin_email: "Se connecter avec email",
    forgot_password: "Mot de passe oublié",
    have_code: "J'ai un code",
    enter_email_reset: "Entrez votre email pour réinitialiser votre mot de passe",
    send_link: "Envoyer le lien",
    welcome_back: "Bienvenue de retour",
    join_community: "Rejoignez la communauté",
    confirm_password: "Confirmer le mot de passe",
    health_profile: "Profil Santé",
    physical_stats: "Statistiques Physiques",
    height: "Taille (cm)",
    weight: "Poids (kg)",
    birth_date: "Date de naissance",
    gender: "Genre",
    male: "Homme",
    female: "Femme",
    activity_level: "Niveau d'activité",
    sedentary: "Sédentaire",
    light: "Léger",
    moderate: "Modéré",
    active: "Actif",
    very_active: "Très actif",
    allergies: "Allergies",
    medical_conditions: "Conditions Médicales",
    diet_type: "Régime Alimentaire",
    disliked_ingredients: "Ingrédients non aimés",
    daily_goals: "Objectifs Journaliers",
    calories: "Calories",
    proteins: "Protéines",
    save: "Enregistrer",
    gluten: "Gluten",
    peanuts: "Arachides",
    lactose: "Lactose",
    eggs: "Œufs",
    soy: "Soja",
    fish: "Poisson",
    shellfish: "Crustacés",
    nuts: "Fruits à coque",
    allergen_warning_title: "Attention : Allergènes détectés",
    allergen_warning_desc: "Ce produit contient des ingrédients signalés dans votre profil santé.",
    diabetes: "Diabète",
    vegan: "Végan",
    keto: "Keto",
    vegetarian: "Végétarien",
    none: "Aucun",
    add_dislike: "Ajouter un ingrédient",
    dislike_placeholder: "Ex: Coriandre",
    smart_alerts: "Alertes Intelligentes",
    smart_alerts_desc: "Recevez des alertes si un produit contient vos allergènes.",




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
    food: 'Food',
    cosmetic: 'Cosmetic',
    scan_food_hint: 'Scan a food barcode',
    scan_cosmetic_hint: 'Scan a cosmetic barcode',
    cosmetic_score_label: 'Cosmetic score',
    analysis_unavailable: 'Analysis unavailable',
    risky_ingredients: 'Risky ingredients',
    no_risky_ingredients: 'No concerning ingredient detected.',
    composition_not_analyzed: 'Composition not analyzed.',
    composition_inci: 'Composition (INCI)',
    risk_high: 'High risk',
    risk_moderate: 'Moderate risk',
    risk_low: 'Low risk',
    add_cosmetic_title: 'Add a cosmetic',
    barcode_label: 'Barcode',
    front_face: 'Front side',
    back_inci: 'Back (INCI)',
    the_product: 'The product',
    ingredients_list: 'Ingredients list',
    product_name_optional: 'Product name (optional)',
    brand_optional: 'Brand (optional)',
    category_optional: 'Category (e.g. face care) — optional',
    send_for_validation: 'Send for review',
    front_photo_required: 'The front photo is required',
    cosmetic_submitted: 'Thank you! Cosmetic sent for review.',
    user_ratings: 'User ratings',
    reviews: 'reviews',
    no_ratings_yet: 'No ratings yet',
    rate_this_product: 'Rate this product',
    your_rating: 'Your rating',
    your_review_placeholder: 'Your review (optional)',
    send_my_rating: 'Submit my rating',
    update_my_rating: 'Update my rating',
    recent_reviews: 'Recent reviews',
    rating_thanks: 'Thanks for your rating!',
    choose_rating: 'Choose a rating (1 to 5 stars)',
    user_fallback: 'User',
    complete_info: 'Complete info',
    theme_dark: 'Dark theme',
    choose: 'Choose',
    account: 'Account',
    about: 'About',
    who_are_we: 'Who are we?',
    privacy_policy: 'Privacy Policy',
    terms_of_service: 'Terms of Service',
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
    mediocre: 'Average',
    bad: 'Bad',
    today: 'Today',
    yesterday: 'Yesterday',
    earlier: 'Earlier',
    scans: 'SCANS',
    avg_score: 'AVG. SCORE',
    alerts: 'ALERTS',
    scan: 'Scan',
    a_problem: 'A problem?',
    home: 'Home',
    search: 'Search',
    carnet: 'Journal',
    me: 'Me',
    scan_in_progress: 'Scanning',
    scan_frame_title: 'Frame the barcode',
    product_detected: 'Product detected',
    add_in_30s: 'Add it to the database in 30 s.',
    product_not_found_q: 'Product not found?',
    add: 'Add',
    additives: 'Additives',
    detected: 'detected',
    risk: 'Risk',
    safe: 'Safe',
    no_additives: 'No additives to report.',
    nutritional_info: 'Nutritional information',
    energy: 'Energy',
    carbs: 'Carbs',
    sat_fat: 'Saturated fat',
    fiber: 'Fiber',
    salt: 'Salt',
    report: 'REPORT',
    your_report: 'Your report.',
    grade: 'Grade',
    products_scanned: 'products scanned',
    report_good: 'Keep it up, your choices are healthy.',
    report_improve: 'A few products to watch this month.',
    distribution: 'Breakdown',
    by_quality: 'by quality',
    skip: 'SKIP',
    onboarding_title_1: 'Eat better, ',
    onboarding_title_2: 'scan by scan.',
    onboarding_subtitle: 'Decode the labels of Algerian products in the blink of an eye.',
    start: 'Get started',
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
    take_photo_nutrition: "Nutrition Table",
    submit_product: "Submit Product",
    photo_error: "Please take both photos of the product.",
    success_title: "Success!",
    success_message: "Product submitted for validation. Thank you!",
    retake_photo: "Retake photo",
    take_photo: "Take photo",
    photo_instruction_front: "Take a clear photo of the front of the product. Make sure the name and brand are readable.",
    photo_instruction_back: "Take a clear photo of the back of the product. The nutrition table and ingredients list must be readable.",
    photo_instruction_nutrition: "Take a clear photo of the nutrition facts table.",
    open_camera: "Open Camera",
    settings_description: "Customize your experience",
    create_account: "Create Account",
    // --- Redesign v2 : Login / Settings / Report ---
    signin_title: 'Eat better,',
    signin_accent: 'it starts here.',
    signin_subtitle: 'Sign in to start scanning.',
    continue_google: 'Continue with Google',
    continue_facebook: 'Continue with Facebook',
    continue_email: 'Continue with e-mail',
    no_account: 'No account yet?',
    my_account: 'My account',
    settings_title: 'Settings',
    preferences: 'Preferences',
    favorites: 'Favorites',
    report_error_title: 'Report an error',
    report_error_why: 'Why does the score of this product',
    report_error_why_end: 'seem incorrect to you?',
    report_placeholder: 'E.g. the calories are wrong…',
    send_report: 'Send report',
    close_cancel: 'Close / Cancel',
    report_empty: 'Please describe the problem.',
    report_thanks: 'Thank you!',
    report_sent: 'Your report has been sent to the team.',
    report_failed: 'Could not send the report.',
    error: 'Error',
    oops: 'Oops',
    signin: "Sign In",
    signin_email: "Sign In with Email",
    forgot_password: "Forgot Password",
    have_code: "I have a code",
    enter_email_reset: "Enter your email to reset your password",
    send_link: "Send Link",
    confirm_password: 'Confirm Password',
    health_profile: "Health Profile",
    physical_stats: "Physical Stats",
    height: "Height (cm)",
    weight: "Weight (kg)",
    birth_date: "Birth Date",
    gender: "Gender",
    male: "Male",
    female: "Female",
    activity_level: "Activity Level",
    sedentary: "Sedentary",
    light: "Light",
    moderate: "Moderate",
    active: "Active",
    very_active: "Very Active",
    allergies: "Allergies",
    medical_conditions: "Medical Conditions",
    diet_type: "Diet Type",
    disliked_ingredients: "Disliked Ingredients",
    daily_goals: "Daily Goals",
    calories: "Calories",
    proteins: "Proteins",
    save: "Save",
    gluten: "Gluten",
    peanuts: "Peanuts",
    lactose: "Lactose",
    eggs: "Eggs",
    soy: "Soy",
    fish: "Fish",
    shellfish: "Shellfish",
    nuts: "Tree nuts",
    allergen_warning_title: "Warning: Allergens detected",
    allergen_warning_desc: "This product contains ingredients flagged in your health profile.",
    diabetes: "Diabetes",
    vegan: "Vegan",
    keto: "Keto",
    vegetarian: "Vegetarian",
    none: "None",
    add_dislike: "Add Ingredient",
    dislike_placeholder: "Ex: Cilantro",
    smart_alerts: "Smart Alerts",
    smart_alerts_desc: "Get alerts if a product contains your allergens.",


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
    food: 'أغذية',
    cosmetic: 'مستحضرات تجميل',
    scan_food_hint: 'امسح باركود منتج غذائي',
    scan_cosmetic_hint: 'امسح باركود مستحضر تجميل',
    cosmetic_score_label: 'نقاط مستحضر التجميل',
    analysis_unavailable: 'التحليل غير متوفر',
    risky_ingredients: 'مكونات خطرة',
    no_risky_ingredients: 'لم يتم رصد أي مكوّن مقلق.',
    composition_not_analyzed: 'لم يتم تحليل التركيبة.',
    composition_inci: 'التركيبة (INCI)',
    risk_high: 'خطر مرتفع',
    risk_moderate: 'خطر متوسط',
    risk_low: 'خطر منخفض',
    add_cosmetic_title: 'إضافة مستحضر تجميل',
    barcode_label: 'الباركود',
    front_face: 'الواجهة الأمامية',
    back_inci: 'الخلف (INCI)',
    the_product: 'المنتج',
    ingredients_list: 'قائمة المكونات',
    product_name_optional: 'اسم المنتج (اختياري)',
    brand_optional: 'الماركة (اختياري)',
    category_optional: 'الفئة (مثل: العناية بالوجه) — اختياري',
    send_for_validation: 'إرسال للمراجعة',
    front_photo_required: 'الصورة الأمامية مطلوبة',
    cosmetic_submitted: 'شكراً! تم إرسال المستحضر للمراجعة.',
    user_ratings: 'تقييمات المستخدمين',
    reviews: 'تقييمات',
    no_ratings_yet: 'لا توجد تقييمات بعد',
    rate_this_product: 'قيّم هذا المنتج',
    your_rating: 'تقييمك',
    your_review_placeholder: 'رأيك (اختياري)',
    send_my_rating: 'إرسال تقييمي',
    update_my_rating: 'تحديث تقييمي',
    recent_reviews: 'أحدث التقييمات',
    rating_thanks: 'شكراً على تقييمك!',
    choose_rating: 'اختر تقييماً (من 1 إلى 5 نجوم)',
    user_fallback: 'مستخدم',
    complete_info: 'إكمال المعلومات',
    theme_dark: 'الوضع الداكن',
    choose: 'اختر',
    account: 'الحساب',
    about: 'حول',
    who_are_we: 'من نحن؟',
    privacy_policy: 'سياسة الخصوصية',
    terms_of_service: 'شروط الاستخدام',
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
    today: 'اليوم',
    yesterday: 'أمس',
    earlier: 'سابقاً',
    scans: 'عمليات المسح',
    avg_score: 'متوسط النتيجة',
    alerts: 'تنبيهات',
    scan: 'مسح',
    a_problem: 'مشكلة؟',
    home: 'الرئيسية',
    search: 'بحث',
    carnet: 'السجل',
    me: 'أنا',
    scan_in_progress: 'جاري المسح',
    scan_frame_title: 'وجّه الباركود',
    product_detected: 'تم اكتشاف المنتج',
    add_in_30s: 'أضفه إلى القاعدة في 30 ثانية.',
    product_not_found_q: 'لم يتم العثور على المنتج؟',
    add: 'إضافة',
    additives: 'المضافات',
    detected: 'مكتشفة',
    risk: 'خطر',
    safe: 'آمن',
    no_additives: 'لا توجد مضافات.',
    nutritional_info: 'المعلومات الغذائية',
    energy: 'الطاقة',
    carbs: 'الكربوهيدرات',
    sat_fat: 'الدهون المشبعة',
    fiber: 'الألياف',
    salt: 'الملح',
    report: 'الحصيلة',
    your_report: 'حصيلتك.',
    grade: 'التقييم',
    products_scanned: 'منتجات ممسوحة',
    report_good: 'واصل هكذا، اختياراتك صحية.',
    report_improve: 'بعض المنتجات تستحق الانتباه هذا الشهر.',
    distribution: 'التوزيع',
    by_quality: 'حسب الجودة',
    skip: 'تخطّي',
    onboarding_title_1: 'كُلْ أفضل، ',
    onboarding_title_2: 'مسحة بمسحة.',
    onboarding_subtitle: 'افهم ملصقات المنتجات الجزائرية في لمح البصر.',
    start: 'ابدأ',
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
    take_photo_nutrition: "الجدول الغذائي",
    submit_product: "إرسال المنتج",
    photo_error: "يرجى التقاط كلتا الصورتين للمنتج.",
    success_title: "نجاح!",
    success_message: "تم إرسال المنتج للتحقق. شكرا لك!",
    retake_photo: "إعادة التقاط الصورة",
    photo_instruction_front: "التقط صورة واضحة للجزء الأمامي من المنتج. تأكد من أن الاسم والعلامة التجارية مقروءان.",
    photo_instruction_back: "التقط صورة واضحة للجزء الخلفي من المنتج. يجب أن يكون الجدول الغذائي وقائمة المكونات مقروءة.",
    photo_instruction_nutrition: "التقط صورة واضحة لجدول القيم الغذائية.",
    open_camera: "فتح الكاميرا",
    take_photo: "التقط الصورة",
    settings_description: "تجربتك الخاصة",
    welcome_back: "مرحبا بك مجددًا",
    signin: "تسجيل الدخول",
    create_account: "إنشاء حساب",
    // --- Redesign v2 : تسجيل الدخول / الإعدادات / الإبلاغ ---
    signin_title: 'كُلْ أفضل،',
    signin_accent: 'يبدأ من هنا.',
    signin_subtitle: 'سجّل الدخول لتبدأ المسح.',
    continue_google: 'المتابعة عبر جوجل',
    continue_facebook: 'المتابعة عبر فيسبوك',
    continue_email: 'المتابعة عبر البريد الإلكتروني',
    no_account: 'ليس لديك حساب بعد؟',
    my_account: 'حسابي',
    settings_title: 'الإعدادات',
    preferences: 'التفضيلات',
    favorites: 'المفضلة',
    report_error_title: 'الإبلاغ عن خطأ',
    report_error_why: 'لماذا تبدو لك نتيجة هذا المنتج',
    report_error_why_end: 'غير صحيحة؟',
    report_placeholder: 'مثال: السعرات الحرارية خاطئة…',
    send_report: 'إرسال البلاغ',
    close_cancel: 'إغلاق / إلغاء',
    report_empty: 'يرجى وصف المشكلة.',
    report_thanks: 'شكرًا!',
    report_sent: 'تم إرسال بلاغك إلى الفريق.',
    report_failed: 'تعذّر إرسال البلاغ.',
    error: 'خطأ',
    oops: 'عذرًا',
    signin_email: "تسجيل الدخول عبر البريد الإلكتروني",
    forgot_password: "نسيت كلمة المرور",
    have_code: "أملك رمز",
    enter_email_reset: "أدخل بريدك الإلكتروني لاستعادة كلمة المرور",
    send_link: "إرسال رابط",
    confirm_password: "تأكيد كلمة المرور",
    health_profile: "الملف الصحي",
    physical_stats: "الإحصاءات البدنية",
    height: "الطول (سم)",
    weight: "الوزن (كجم)",
    birth_date: "تاريخ الميلاد",
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
    activity_level: "مستوى النشاط",
    sedentary: "خامل",
    light: "خفيف",
    moderate: "معتدل",
    active: "نشيط",
    very_active: "نشيط جدا",
    allergies: "الحساسية",
    medical_conditions: "الحالات الطبية",
    diet_type: "نوع النظام الغذائي",
    disliked_ingredients: "مكونات غير مرغوبة",
    daily_goals: "الأهداف اليومية",
    calories: "سعرات حرارية",
    proteins: "بروتينات",
    save: "حفظ",
    gluten: "غلوتين",
    peanuts: "فول سوداني",
    lactose: "لاكتوز",
    eggs: "بيض",
    soy: "صويا",
    fish: "سمك",
    shellfish: "محار",
    nuts: "مكسرات",
    allergen_warning_title: "تنبيه: تم رصد مسببات حساسية",
    allergen_warning_desc: "يحتوي هذا المنتج على مكونات مسجلة في ملفك الصحي.",
    diabetes: "سكري",
    vegan: "نباتي صرف",
    keto: "كيتو",
    vegetarian: "نباتي",
    none: "لا شيء",
    add_dislike: "إضافة مكون",
    dislike_placeholder: "مثال: كزبرة",
    smart_alerts: "تنبيهات ذكية",
    smart_alerts_desc: "احصل على تنبيهات إذا كان المنتج يحتوي على مسببات الحساسية الخاصة بك.",




  }
};

let currentLang: SupportedLang = 'fr';
let followSystem: boolean = true;
const listeners: ((lang: SupportedLang) => void)[] = [];

let reactNativeLocalize: any = null;
try {
  reactNativeLocalize = require('react-native-localize');
} catch {
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
  } catch {
    // ignore
  }
  return 'fr';
}

function notifyListeners(l: SupportedLang) {
  if (__DEV__) console.log('[i18n] notifyListeners ->', l);
  listeners.forEach((cb) => {
    try { cb(l); } catch { /* ignore */ }
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
  } catch {
    // ignore
  }
  return 'fr';
}

export async function getStoredFollow(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_FOLLOW);
    if (v === null) return true; // default to follow system
    return v === '1' || v === 'true';
  } catch {
    return true;
  }
}

export async function setStoredFollow(val: boolean) {
  followSystem = val;
  try {
    await AsyncStorage.setItem(STORAGE_FOLLOW, val ? '1' : '0');
  } catch {
    // ignore
  }
}

export async function setStoredLang(lang: SupportedLang) {
  currentLang = lang;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
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
    } catch {
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
    } catch {
      return { needsRestart: true };
    }
  };

  const translate = (key: string) => {
    return translations[lang]?.[key] ?? key;
  };

  return { lang, setLanguage, setFollowSystem, follow: followSystem, t: translate };
}

export default { getStoredLang, setStoredLang, t };
