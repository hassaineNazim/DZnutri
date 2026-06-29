import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Settings } from 'react-native-fbsdk-next';
import "../global.css";
import { api } from "./services/axios";
import { getAccessToken } from "./services/tokenStore";

// Call this before your app component renders
Settings.initializeSDK();

export default function Index() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        checkLoginStatus();
    }, []);

    // Re-validate token whenever the screen regains focus
    useFocusEffect(
        useCallback(() => {
            checkLoginStatus(true);
        }, [])
    );

    const checkLoginStatus = async (validateRemote: boolean = false) => {
        setIsLoading(true);
        let loggedIn = false;
        try {
            const token = await getAccessToken();
            if (!token) {
                loggedIn = false;
            } else if (validateRemote) {
                try {
                    // Passe par l'instance `api` : l'intercepteur rafraîchit
                    // automatiquement un access token expiré via le refresh token.
                    await api.get('/auth/me');
                    loggedIn = true;
                } catch (e: any) {
                    if (e?.response?.status === 401) {
                        // Rafraîchissement impossible : session terminée
                        // (tokens déjà nettoyés par l'intercepteur).
                        loggedIn = false;
                    } else {
                        // Erreur réseau/serveur : on reste connecté (optimiste).
                        loggedIn = true;
                    }
                }
            } else {
                loggedIn = true;
            }
        } catch {
            loggedIn = false;
        } finally {
            setIsLoggedIn(loggedIn);
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return null;
    }

    if (isLoggedIn) {
        return <Redirect href="/(tabs)/historique" />;
    } else {
        return <Redirect href="/auth" />;
    }
}
