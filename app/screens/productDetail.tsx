// app/ProductDetails.tsx (ou screens/ProductDetails.tsx)
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThumbsDown, ThumbsUp, X } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// On étend le type Product (doit correspondre à ce que votre API retourne)
type Product = {
  id: string;
  product_name?: string;
  brand?: string;
  image_url?: string;
  custom_score?: number;
  nutriscore_grade?: string; // Utilisez nutriscore_grade pour le Nutri-Score officiel si dispo
  nova_group?: number;
  additives_tags?: string[];
  ecoscore_grade?: string;
  detail_custom_score?: { [key: string]: string[] | { [key: string]: number } }; // Type plus précis
  nutriments?: { [key: string]: any }; // Pour accéder aux détails des nutriments
};

// --- Fonctions Utilitaires (copiées depuis Scanner.tsx, car elles sont utiles ici aussi) ---
const getScoreColor = (score?: number) => {
  if (score === undefined) return '#6B7280'; // Gris
  if (score >= 75) return '#22C55E'; // Vert
  if (score >= 50) return '#84CC16'; // Vert-citron
  if (score >= 25) return '#F97316'; // Orange
  return '#EF4444'; // Rouge
};

const getScoreDescription = (score?: number) => {
    if (score === undefined) return 'Inconnu';
    if (score >= 75) return 'Excellent';
    if (score >= 50) return 'Bon';
    if (score >= 25) return 'Médiocre';
    return 'Mauvais';
}

const ScoreDetailItem = ({ text, isPositive, value }: { text: string; isPositive: boolean; value?: string | number }) => (
  <View style={styles.detailItem}>
    {isPositive ? (
      <ThumbsUp size={20} color="#22C55E" style={styles.detailIcon} />
    ) : (
      <ThumbsDown size={20} color="#EF4444" style={styles.detailIcon} />
    )}
    <Text style={styles.detailText}>{text}</Text>
    {value !== undefined && <Text style={styles.detailValue}>{value}</Text>}
    {/* Optionnel: Ajouter une flèche si on veut un sous-détail */}
  </View>
);

// --- Composant Principal de la Page Détail Produit ---
export default function ProductDetails() {
  const router = useRouter();
  const { product: productJson } = useLocalSearchParams();
  
  // Assurez-vous que productJson est une chaîne et parsez-la
  const product: Product | null = productJson ? JSON.parse(productJson as string) : null;

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Produit non trouvé.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fonctions d'aide pour extraire les valeurs des nutriments
  const getNutrimentValue = (key: string) => product?.nutriments?.[key + '_100g'] ?? 'N/A';
  const getNutrimentUnit = (key: string) => product?.nutriments?.[key + '_unit'] ?? '';


  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* En-tête avec bouton de fermeture */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                <X size={24} color="#6B7280" />
            </TouchableOpacity>
            {/* Vous pouvez ajouter d'autres icônes ici comme "Favoris" */}
        </View>

        {/* --- Image et Nom du Produit --- */}
        <View style={styles.productSummary}>
          <Image
            source={{ uri: product.image_url || 'https://via.placeholder.com/150' }}
            style={styles.productImage}
          />

          <View style={styles.productTextContainer}> 
           <Text style={styles.productName} numberOfLines={2}>{product.product_name || 'Nom inconnu'}</Text>
           <Text style={styles.productBrand}>{product.brand || 'Marque inconnue'}</Text>
         </View>
        </View>

        {/* --- Section du Score Global --- */}
        <View style={styles.scoreSection}>
          <View style={[styles.scoreCircle, { backgroundColor: getScoreColor(product.custom_score) }]}>
            <Text style={styles.scoreText}>{product.custom_score ?? '?'}</Text>
            <Text style={styles.scoreUnit}>/100</Text>
          </View>
          <Text style={[styles.scoreDescription, { color: getScoreColor(product.custom_score) }]}>
            {getScoreDescription(product.custom_score)}
          </Text>
        </View>

        {/* --- Section des Défauts --- */}
        <View style={styles.detailsBlock}>
          <Text style={styles.blockTitle}>Défauts</Text>
          {product.detail_custom_score?.nova && (
             <ScoreDetailItem text="Transformation" isPositive={false} value={product.nova_group} />
          )}
          {product.detail_custom_score?.energy && (
            <ScoreDetailItem text="Énergie" isPositive={false} value={`${getNutrimentValue('energy-kcal')} ${getNutrimentUnit('energy-kcal')}`} />
          )}
          {product.detail_custom_score?.sugars && (
            <ScoreDetailItem text="Sucres" isPositive={false} value={`${getNutrimentValue('sugars')} ${getNutrimentUnit('sugars')}`} />
          )}
          {product.detail_custom_score?.satfat && (
            <ScoreDetailItem text="Graisses saturées" isPositive={false} value={`${getNutrimentValue('saturated-fat')} ${getNutrimentUnit('saturated-fat')}`} />
          )}
          {product.detail_custom_score?.additives && (
            <ScoreDetailItem text="Additifs controversés" isPositive={false} value={Object.keys(product.detail_custom_score.additives as {}).length} />
          )}
          {/* Ajoutez d'autres défauts ici en fonction de detail_custom_score */}
        </View>

        {/* --- Section des Qualités --- */}
        <View style={styles.detailsBlock}>
          <Text style={styles.blockTitle}>Qualités</Text>
          {product.nutriments?.fiber_100g && product.nutriments.fiber_100g > 3 && (
            <ScoreDetailItem text="Fibres" isPositive={true} value={`${getNutrimentValue('fiber')} ${getNutrimentUnit('fiber')}`} />
          )}
          {product.nutriments?.proteins_100g && product.nutriments.proteins_100g > 10 && (
            <ScoreDetailItem text="Protéines" isPositive={true} value={`${getNutrimentValue('proteins')} ${getNutrimentUnit('proteins')}`} />
          )}
          {/* Ajoutez d'autres qualités ici */}
        </View>

        {/* --- Informations Complémentaires (Nutri-Score, Eco-Score, etc.) --- */}
        <View style={styles.detailsBlock}>
            <Text style={styles.blockTitle}>Informations complémentaires</Text>
            {product.nutriscore_grade && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Nutri-Score officiel :</Text>
                    <Text style={styles.infoValue}>{product.nutriscore_grade.toUpperCase()}</Text>
                </View>
            )}
            {product.nova_group && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Groupe NOVA :</Text>
                    <Text style={styles.infoValue}>{product.nova_group}</Text>
                </View>
            )}
            {product.ecoscore_grade && (
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Eco-Score :</Text>
                    <Text style={styles.infoValue}>{product.ecoscore_grade.toUpperCase()}</Text>
                </View>
            )}
        </View>

      </ScrollView>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8', // Un fond plus clair pour la page de détail
  },
  scrollContent: {
    paddingBottom: 40, // Espace en bas pour le défilement
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Bouton de fermeture à gauche
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 5,
  },
 productSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 20,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginRight: 15,
    marginLeft: -35,
    resizeMode: 'contain',
  },
  // Style pour le nouveau conteneur de texte
  productTextContainer: {
    flex: 1, // Prend tout l'espace restant à droite de l'image
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4, // Ajoute un petit espace sous le nom
    marginTop: -30,
    marginLeft: -30,
    
  },
  productBrand: {
    fontSize: 16,
    color: '#666',
    marginLeft: -30,

  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  scoreCircle: {
    width: 140, // Plus grand cercle
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 6, // Bordure plus épaisse
    borderColor: 'white',
    elevation: 8, // Ombre plus prononcée
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  scoreText: {
    fontSize: 48, // Texte plus grand
    color: 'white',
    fontWeight: 'bold',
  },
  scoreUnit: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
    marginTop: 18,
  },
  scoreDescription: {
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 15,
  },
  detailsBlock: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    
  },
  blockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  detailIcon: {
    marginRight: 15,
  },
  detailText: {
    fontSize: 16,
    color: '#444',
    flex: 1, // Permet au texte de prendre l'espace restant
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
      fontSize: 16,
      color: '#444',
  },
  infoValue: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 50,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  }
});