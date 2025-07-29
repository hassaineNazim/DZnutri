import { useRouter } from "expo-router";
import { Lock, User } from 'lucide-react-native';
import React, { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from "../config/api";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    // --- Validation Côté Client ---
    if (!username || !password || !confirmPassword) {
      setMessage("Erreur : Tous les champs sont obligatoires.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Erreur : Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage("Compte créé avec succès ! Vous pouvez maintenant vous connecter.");
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } else {
        setMessage("Erreur : " + (data.detail || "Impossible de créer le compte."));
      }
    } catch (error) {
      setMessage("Erreur : Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white p-6">
      <Text className="text-4xl font-bold text-gray-800 mb-12">Créer un compte</Text>

      {/* Champ Nom d'utilisateur */}
      <View className="flex-row items-center bg-gray-100 p-4 rounded-xl mb-4">
        <User color="gray" size={20} />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-800"
          placeholder="Nom d'utilisateur"
          placeholderTextColor="gray"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      </View>

      {/* Champ Mot de passe */}
      <View className="flex-row items-center bg-gray-100 p-4 rounded-xl mb-4">
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
      
      {/* Champ Confirmer le Mot de passe */}
      <View className="flex-row items-center bg-gray-100 p-4 rounded-xl mb-8">
        <Lock color="gray" size={20} />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-800"
          placeholder="Confirmer le mot de passe"
          placeholderTextColor="gray"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      {/* Messages d'erreur ou de succès */}
      {message ? (
        <Text className={`text-center mb-4 ${message.includes('Erreur') ? 'text-red-500' : 'text-green-500'}`}>{message}</Text>
      ) : null}

      {/* Bouton de création de compte */}
      <TouchableOpacity
        onPress={handleSignup}
        disabled={loading}
        className="bg-lime-500 py-4 rounded-xl flex-row justify-center items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">Créer mon compte</Text>
        )}
      </TouchableOpacity>

      {/* Section pour se connecter */}
      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-500">Déjà un compte ?</Text>
        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text className="text-lime-500 font-bold ml-2">Se connecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}