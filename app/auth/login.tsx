import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Lock, Mail } from 'lucide-react-native';
import React, { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from "../config/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // Pour l'indicateur de chargement
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage("Erreur : Tous les champs sont obligatoires.");
      return;
    }
    setLoading(true); // Active le chargement
    setMessage(""); // Réinitialise le message

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });
      const data = await response.json();
      if (response.ok) {
        await AsyncStorage.setItem('userToken', data.access_token);
        // Utilise "replace" pour une meilleure expérience utilisateur
        router.replace("/(tabs)/historique"); 
      } else {
        setMessage("Erreur : " + (data.detail || "Identifiants incorrects"));
      }
    } catch (error) {
      setMessage("Erreur : Impossible de contacter le serveur.");
    } finally {
      setLoading(false); // Désactive le chargement
    }
  };

  return (
    <View className="flex-1 justify-center bg-white p-6">
      <Text className="text-4xl font-bold text-gray-800 mb-4">Content de</Text>
      <Text className="text-4xl font-bold text-gray-800 mb-12">vous revoir !</Text>

      {/* Champ Email */}
      <View className="flex-row items-center bg-gray-100 p-4 rounded-xl mb-4">
        <Mail color="gray" size={20} />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-800"
          placeholder="Email ou nom d'utilisateur"
          placeholderTextColor="gray"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      {/* Champ Mot de passe */}
      <View className="flex-row items-center bg-gray-100 p-4 rounded-xl mb-8">
        <Lock color="gray" size={20} />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-800"
          placeholder="Mot de passe"
          placeholderTextColor="gray"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {/* Affichage des messages d'erreur/succès */}
      {message ? (
        <Text className="text-center text-red-500 mb-4">{message}</Text>
      ) : null}

      {/* Bouton de connexion */}
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading} // Désactive le bouton pendant le chargement
        className="bg-lime-500 py-4 rounded-xl flex-row justify-center items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">Se connecter</Text>
        )}
      </TouchableOpacity>

      {/* Section pour créer un compte */}
      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-500">Pas encore de compte ?</Text>
        <TouchableOpacity onPress={() => router.push("/auth/signup")}>
          <Text className="text-lime-500 font-bold ml-2">Créer un compte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}