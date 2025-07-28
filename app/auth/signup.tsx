import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { API_URL } from "../config/api";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    if (!username || !password) {
      Alert.alert("Erreur", "Tous les champs sont obligatoires.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Compte créé !");
        // Alert.alert("Succès", "Compte créé !");
        setUsername("");
        setPassword("");
        
       
        setTimeout(() => {
          router.push("/(tabs)/reglage");
        }, 1500); 
      } else {
        Alert.alert("Erreur", data.detail || "Erreur lors de l'inscription");
      }
    } catch (error) {
      Alert.alert("Erreur", "Impossible de contacter le serveur.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
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
      <Button title="S'inscrire" onPress={handleSignup} />
      {message ? (
        <Text style={{color: message.includes("Erreur") ? "red" : "green"}}>
          {message}
        </Text>
      ) : null}
      
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Déjà un compte ?</Text>
        <Button title="Se connecter" onPress={() => router.push("/auth/login")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 15, borderRadius: 5 },
  loginContainer: { marginTop: 20, alignItems: "center" },
  loginText: { marginBottom: 10, fontSize: 16 },
});