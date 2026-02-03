import { useMemo } from 'react';
import { useUserProfile } from './useUserProfile';

// Mapping of allergy IDs (from profile-sante) to keywords (in ingredients text)
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
    gluten: ['gluten', 'blé', 'ble', 'orge', 'seigle', 'avoine', 'froment', 'kamut', 'épeautre', 'epeautre', 'wheat', 'barley', 'rye', 'oat'],
    peanuts: ['arachide', 'cacahuète', 'cacahuete', 'peanut'],
    lactose: ['lait', 'milk', 'lactose', 'crème', 'creme', 'beurre', 'butter', 'fromage', 'cheese', 'yaourt', 'yogurt', 'lactérum', 'lacterum', 'caséine', 'caseine', 'petit-lait'],
    eggs: ['œuf', 'oeuf', 'egg', 'blanc d\'œuf', 'jaune d\'œuf'],
    soy: ['soja', 'soya', 'soy'],
    fish: ['poisson', 'fish', 'thon', 'tuna', 'saumon', 'salmon', 'cabillaud', 'cod', 'morue'],
    shellfish: ['crustacé', 'crustace', 'shellfish', 'crevette', 'shrimp', 'prawn', 'crabe', 'crab', 'homard', 'lobster', 'moule', 'mussel', 'huître', 'oyster', 'molusque'],
    nuts: ['fruit à coque', 'fruit a coque', 'nut', 'amande', 'almond', 'noisette', 'hazelnut', 'noix', 'walnut', 'cajou', 'cashew', 'pistache', 'pistachio', 'macadamia', 'pécan', 'pecan']
};

export const useAllergenCheck = (ingredientsText?: string) => {
    const { data: profile } = useUserProfile();

    const detectedAllergens = useMemo(() => {
        if (!profile || !profile.allergies || profile.allergies.length === 0 || !ingredientsText) {
            return [];
        }

        const textLower = ingredientsText.toLowerCase();
        const found: string[] = [];

        profile.allergies.forEach((allergyId) => {
            const keywords = ALLERGEN_KEYWORDS[allergyId];
            if (keywords) {
                // Check if any keyword key is present in the text
                const isPresent = keywords.some(keyword => textLower.includes(keyword.toLowerCase()));
                if (isPresent) {
                    found.push(allergyId);
                }
            }
        });

        return found;
    }, [profile, ingredientsText]);

    return {
        detectedAllergens,
        hasAllergies: detectedAllergens.length > 0,
        userAllergies: profile?.allergies || []
    };
};
