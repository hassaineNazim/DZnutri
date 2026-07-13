/**
 * Design tokens du redesign DZnutri (« scan par scan »).
 * Source de vérité unique : couleurs, polices, rayons, ombres, helpers de score.
 * Recréé fidèlement depuis le handoff design (design_handoff_dznutri).
 */

// --- Couleurs ---------------------------------------------------------------
export const colors = {
  // Fonds
  bordeaux: '#59121F', // Onboarding / Accueil / Détail (fond principal)
  bordeauxDeep: '#3c0e17', // bandeau titre très foncé
  dark: '#141110', // Scan / entête Bilan
  darkAlt: '#241d18', // dégradé radial du scan
  navBordeaux: '#4d1521', // barre de navigation basse

  // Surfaces claires
  cream: '#F4EAD6', // fond de contenu, feuille
  creamTitle: '#F6EEDD', // titres crème sur fond sombre
  white: '#ffffff',
  ringTrack: '#ece2cc', // piste (vide) des anneaux de score

  // Accent
  yellow: '#F2C22E', // CTA, accents, scanner
  yellowHover: '#e7b01c',
  inkOnYellow: '#1c1108', // texte foncé sur jaune

  // Textes
  ink: '#1e1712', // texte principal foncé (sur crème)
  inkSoft: '#8b8073', // texte secondaire gris-brun
  inkMeta: '#b7ad9e', // texte tertiaire / méta
  rose: '#cf9ea7', // texte rosé sur bordeaux
  rose2: '#dba9b1',
  rose3: '#e8b6be',

  // Échelle de score / notes
  green: '#4F9E5A', // Excellent / A
  greenAlt: '#4FA65B',
  limeB: '#8CBB4C', // B
  yellowC: '#F0C02E', // C / Moyen
  orange: '#E08A3C', // Moyen / D
  orangeAlt: '#EF8A3C',
  red: '#D24B33', // Médiocre / Risque / E
  redAlt: '#E0492F',
  laser: '#ff3b30', // laser de scan

  // Châssis (prototype uniquement — non utilisé en natif)
  bezel: '#0a090b',
} as const;

// --- Polices ----------------------------------------------------------------
// Noms exacts chargés via useFonts() dans app/_layout.tsx.
export const fonts = {
  // Playfair Display — titres, chiffres, scores
  displayMedium: 'PlayfairDisplay_500Medium',
  displayBold: 'PlayfairDisplay_700Bold',
  displayExtraBold: 'PlayfairDisplay_800ExtraBold',
  displayBlack: 'PlayfairDisplay_900Black',
  displayBlackItalic: 'PlayfairDisplay_900Black_Italic',
  // DM Sans — corps, UI, boutons
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
} as const;

// --- Rayons -----------------------------------------------------------------
export const radius = {
  card: 20, // cartes produit
  cardSm: 16, // cartes additifs / nutrition
  sheet: 26, // feuille de contenu (haut)
  pill: 30, // chips / pilules
  cta: 40, // gros bouton CTA
  badge: 12, // badges additifs
} as const;

// --- Ombres (react-native shadow objects) -----------------------------------
export const shadows = {
  floatCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  listCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  resultCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 12,
  },
  nav: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
  },
  scanButton: {
    shadowColor: colors.yellow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
} as const;

// --- Système de score -------------------------------------------------------
// Paliers alignés sur le reste de l'app : >=75 excellent, >=50 bon,
// >=25 médiocre/moyen, sinon mauvais. (Le handoff mentionne un seuil orange
// 40–59 mais on conserve l'échelle 75/50/25 déjà en place partout ailleurs
// pour rester cohérent.)
export type ScoreBand = {
  color: string; // couleur de l'anneau / pastille
  label: string; // libellé FR par défaut (i18n possible en surcouche)
  labelKey: string; // clé i18n
};

export function scoreBand(score?: number | null): ScoreBand {
  if (typeof score !== 'number') {
    return { color: colors.inkMeta, label: 'N/A', labelKey: 'not_available' };
  }
  if (score >= 75) return { color: colors.green, label: 'Excellent', labelKey: 'excellent' };
  if (score >= 50) return { color: colors.limeB, label: 'Bon', labelKey: 'good' };
  if (score >= 25) return { color: colors.orange, label: 'Moyen', labelKey: 'mediocre' };
  return { color: colors.red, label: 'Mauvais', labelKey: 'bad' };
}

export function scoreColor(score?: number | null): string {
  return scoreBand(score).color;
}

// Lettre A→E à partir du score (pour la barre de note et le badge).
export function scoreGrade(score?: number | null): 'A' | 'B' | 'C' | 'D' | 'E' | '?' {
  if (typeof score !== 'number') return '?';
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'E';
}

// Couleur par lettre de note (barre A→E).
export const gradeColors: Record<'A' | 'B' | 'C' | 'D' | 'E', string> = {
  A: colors.greenAlt,
  B: colors.limeB,
  C: colors.yellowC,
  D: colors.orangeAlt,
  E: colors.redAlt,
};

// Niveau nutritionnel (Faible / Moyen / Élevé) → couleur de chip.
export function levelColor(level?: string): string {
  const l = (level || '').toLowerCase();
  if (l.startsWith('faible') || l.startsWith('low')) return colors.greenAlt;
  if (l.startsWith('moyen') || l.startsWith('medium')) return colors.orangeAlt;
  if (l.startsWith('élevé') || l.startsWith('eleve') || l.startsWith('high')) return colors.redAlt;
  return colors.inkSoft;
}
