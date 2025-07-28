import { Platform } from 'react-native';

const getApiUrl = () => {
   
    console.log("Plateforme détectée :", Platform.OS); 

    if (Platform.OS === 'web') {
        // navigateur
        return "http://127.0.0.1:8000";
    } else {
        // mobile (Android/iOS) 
        return "http://192.168.97.150:8000"; //hna dir adress ip ta3ek, cmd => ipconfig => ...
    }
};

export const API_URL = getApiUrl();