import { api } from './axios';

export const reportProduct = async (

    barcode: string,
    description: string,
    type: string = 'scoringReport',
    imageUrl: string | null = null
) => {
    console.log("ENVOI AU BACKEND :", { barcode, type, description, imageUrl });
    try {
        const response = await api.post('/api/reports', {
            barcode: barcode,
            type: type,
            description: description,
            image_url: imageUrl
        });
        return response.data;
    } catch (error) {
        console.error("Erreur report:", error);
        throw error;
    }
};