import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Settings } from 'react-native-fbsdk-next';
import "../global.css";
import { API_URL } from "./config/api";

// Call this before your app component renders
Settings.initializeSDK();

// ... rest of your App.js
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
        let intertIsLoggedIn = false;
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                intertIsLoggedIn = false;
            } else if (validateRemote) {
                try {
                    const resp = await fetch(`${API_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (resp.ok) {
                        intertIsLoggedIn = true;
                    } else if (resp.status === 401) {
                        // Only logout if explicitly unauthorized (expired/invalid token)
                        await AsyncStorage.removeItem('userToken');
                        intertIsLoggedIn = false;
                    } else {
                        // Server error (500) or other issues: Optimistically keep user logged in
                        intertIsLoggedIn = true;
                    }
                } catch {
                    // Network failure: keep user logged in optimistically
                    intertIsLoggedIn = true;
                }
            } else {
                intertIsLoggedIn = true;
            }
        } catch (error) {
            intertIsLoggedIn = false;
        } finally {
            setIsLoggedIn(intertIsLoggedIn);
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
