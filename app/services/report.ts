import { api } from './axios';

export const reportProduct = async (barcode: string, description: string) => {
    try {
        const response = await api.post('/api/reports', {
            barcode: barcode,
            type: 'scoringReport', // L'enum que nous avons défini dans le backend
            description: description
        });
        return response.data;
    } catch (error) {
        console.error("Erreur lors du signalement :", error);
        throw error;
    }
};