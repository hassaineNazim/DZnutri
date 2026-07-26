import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import "../global.css";
import { ONBOARDING_KEY } from "./onboarding";
import { api } from "./services/axios";
import { getAccessToken } from "./services/tokenStore";

export default function Index() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [seenOnboarding, setSeenOnboarding] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const bootstrap = async () => {
            let loggedIn = false;
            try {
                const [seen, token] = await Promise.all([
                    AsyncStorage.getItem(ONBOARDING_KEY).catch(() => '1'),
                    getAccessToken(),
                ]);
                if (!cancelled) setSeenOnboarding(seen === '1');

                if (token) {
                    try {
                        // Une seule validation distante au démarrage. L'intercepteur
                        // gère le refresh et le garde global gère une éventuelle 401.
                        await api.get('/auth/me');
                        loggedIn = true;
                    } catch (error: unknown) {
                        const status =
                            typeof error === 'object' &&
                            error !== null &&
                            'response' in error
                                ? (error as { response?: { status?: number } }).response?.status
                                : undefined;
                        // Hors 401, on autorise le mode dégradé hors-ligne.
                        loggedIn = status !== 401 && Boolean(await getAccessToken());
                    }
                }
            } catch {
                loggedIn = false;
            } finally {
                if (!cancelled) {
                    setIsLoggedIn(loggedIn);
                    setIsLoading(false);
                }
            }
        };

        bootstrap();
        return () => {
            cancelled = true;
        };
    }, []);

    if (isLoading) {
        return null;
    }

    if (isLoggedIn) {
        return <Redirect href="/(tabs)/historique" />;
    } else if (!seenOnboarding) {
        // Cast : les types de routes typées d'expo-router se régénèrent au
        // lancement (expo start / build) ; /onboarding existe bien.
        return <Redirect href={"/onboarding" as any} />;
    } else {
        return <Redirect href="/auth" />;
    }
}
