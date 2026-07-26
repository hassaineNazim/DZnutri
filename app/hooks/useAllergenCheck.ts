import { useMemo } from 'react';
import { detectAllergens } from '../utils/allergens';
import { useUserProfile } from './useUserProfile';

export const useAllergenCheck = (ingredientsText?: string) => {
    const { data: profile } = useUserProfile();

    const detectedAllergens = useMemo(() => {
        if (!profile || !profile.allergies || profile.allergies.length === 0 || !ingredientsText) {
            return [];
        }

        return detectAllergens(ingredientsText, profile.allergies);
    }, [profile, ingredientsText]);

    return {
        detectedAllergens,
        hasAllergies: detectedAllergens.length > 0,
        userAllergies: profile?.allergies || []
    };
};
