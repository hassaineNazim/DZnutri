import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getApiUrl = () => {
    console.log('Plateforme détectée :', Platform.OS);

    // Web: local dev server
    if (Platform.OS === 'web') {
        return 'http://127.0.0.1:8000';
    }

    // Try to detect host from Expo manifest (useful when running on a physical device via Expo)
    const manifest = Constants.manifest || Constants.expoConfig || {};
    const debuggerHost = manifest.debuggerHost || manifest.hostUri || null;
    if (debuggerHost) {
        // debuggerHost is usually like "192.168.1.10:19000"
        const host = debuggerHost.split(':')[0];
        console.log('Detected dev host from Expo manifest:', host);
        return `http://${host}:8000`;
    }

   

    // Fallback: previously configured local IP (update if your machine IP differs)
    return 'http://192.168.100.38:8000';
};

export const API_URL = getApiUrl();