import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AjouterProduitInfoPage() {
  const router = useRouter();
  // 1. On récupère le code-barres et le type passés par la page précédente
  const { barcode, type } = useLocalSearchParams<{ barcode: string, type: string }>();

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');

  const handleNext = () => {
    if (!productName || !brand) {
      alert("Veuillez remplir le nom et la marque du produit.");
      return;
    }

    // 4. On passe TOUTES les informations à la dernière page (la photo)
    router.push({
      pathname: './ajouterProdPhoto',
      params: { barcode, type, productName, brand },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Détails du produit</Text>

      {/* 2. Le champ code-barres est pré-rempli et non modifiable */}
      <Text style={styles.label}>Code-barres</Text>
      <TextInput
        style={[styles.input, styles.disabledInput]}
        value={barcode}
        editable={false} 
      />

      <Text style={styles.label}>Nom du produit</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Biscuit Prince"
        value={productName}
        onChangeText={setProductName}
      />

      <Text style={styles.label}>Marque</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: LU"
        value={brand}
        onChangeText={setBrand}
      />
      
      {/* 3. Le bouton "Suivant" */}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Suivant</Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles pour un design propre
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    marginTop: 40,
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  disabledInput: {
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
  },
  button: {
    backgroundColor: '#84CC16',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});