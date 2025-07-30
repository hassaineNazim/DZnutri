import { Platform } from 'react-native';

const getApiUrl = () => {
   
    console.log("Plateforme détectée :", Platform.OS); 

    if (Platform.OS === 'web') {
        // navigateur
        return "http://127.0.0.1:8000";
    } else {
        // mobile (expo go) 
        return "http://192.168.100.38:8000"; //hna dir adress ip ta3ek.
    }
};

export const API_URL = getApiUrl();