import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import "../global.css";

export default function Index() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            setIsLoggedIn(!!token);
        } catch (error) {
            console.log('Erreur lors de la vérification du token');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoggedIn) {
        return <Redirect href="/(tabs)/historique" />; 
    } else {
         return <Redirect href="/auth" />;
    }
}
 