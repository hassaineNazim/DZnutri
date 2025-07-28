import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { API_URL } from "../config/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Erreur", "Tous les champs sont obligatoires.");
      return;
    }
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
        // Stocker le token
        await AsyncStorage.setItem('userToken', data.access_token);
        
        setMessage("Connexion réussie ! Token : " + data.access_token);
        console.log("connexion réussie !")
        setUsername("");
        setPassword("");
        
        // Rediriger vers la page principale après un court délai
        setTimeout(() => {
          router.push("/(tabs)/reglage");
        }, 1500); // 1.5 secondes de délai pour voir le message de succès
      } else {
        setMessage("Erreur : " + (data.detail || "Serveur erreur"));
        console.log("erreur coté serveur ")
      }
    } catch (error) {
      
      console.log('Pas assez au serveur §')
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom d'utilisateur"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Se connecter" onPress={handleLogin} />
      {message ? (
        <Text style={{color: message.includes("Erreur") ? "red" : "green"}}>
          {message}
        </Text>
      ) : null}
      
      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Pas encore de compte ?</Text>
        <Button title="Créer un compte" onPress={() => router.push("/auth/signup")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 15, borderRadius: 5 },
  signupContainer: { marginTop: 20, alignItems: "center" },
  signupText: { marginBottom: 10, fontSize: 16 },
});
