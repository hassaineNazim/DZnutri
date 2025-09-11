import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchProduct } from './services/openFoodFacts'; // Adaptez le chemin
import { saveToHistory } from './services/saveLocal'; // Adaptez le chemin

// Le type Product doit correspondre à ce que votre API retourne
type Product = {
  id: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  custom_score?: number;
  // Ajoutez les autres champs que vous voudrez passer à la page de détail
};

// On utilise un seul état pour gérer les différents cas du scanner
type ScanResult = 
  | { status: 'scanning' }
  | { status: 'loading' }
  | { status: 'found', product: Product }
  | { status: 'notFound', barcode: string };

// --- Fonctions Utilitaires pour la mini-popup ---
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

// --- Composant Principal du Scanner ---
export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = useState<ScanResult>({ status: 'scanning' });
  const router = useRouter();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanResult.status !== 'scanning') return; // Bloque si un scan est déjà en cours
    
    setScanResult({ status: 'loading' }); // Affiche l'indicateur de chargement

    try {
      const fetchedProduct = await fetchProduct(data);
      if (fetchedProduct) {
        setScanResult({ status: 'found', product: fetchedProduct });
        await saveToHistory(fetchedProduct);
      } else {
        setScanResult({ status: 'notFound', barcode: data });
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setScanResult({ status: 'notFound', barcode: data });
    }
  };

  // Fonction pour fermer le modal et réinitialiser le scanner
  const resetScanner = () => setScanResult({ status: 'scanning' });

  // Fonction pour naviguer vers la page de détails du produit
  const navigateToProductDetails = (product: Product) => {
    // On passe l'objet produit entier en le convertissant en chaîne JSON
    router.push({
      pathname: './screens/productDetail', // Assurez-vous que le fichier app/ProductDetails.tsx existe
      params: { product: JSON.stringify(product) },
    });
  };

  // Affiche l'écran de permission si nécessaire
  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Nous avons besoin de la permission de la caméra.</Text>
        <Button onPress={requestPermission} title="Donner la permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanResult.status === 'scanning' ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8'] }}
      />
      <View style={styles.overlay}>
        <View style={styles.scanBox} />
      </View>

      {scanResult.status === 'loading' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      <Modal
        visible={scanResult.status === 'found' || scanResult.status === 'notFound'}
        transparent={true}
        animationType="slide"
        onRequestClose={resetScanner}
      >
        <Pressable style={styles.modalOverlay} onPress={resetScanner}>
          {/* Le contenu du Modal change si un produit a été trouvé ou non */}
          
          {scanResult.status === 'found' && (
            <TouchableOpacity 
                style={styles.miniModalContent} 
                onPress={() => navigateToProductDetails(scanResult.product)}
                activeOpacity={0.9}
            >
              <View style={styles.productInfoContainer}>
                <Image
                  source={{ uri: scanResult.product.image_url || 'https://via.placeholder.com/64' }}
                  style={styles.productImageMini}
                />
                <View style={styles.productTextContainer}>
                    <Text style={styles.productNameMini} numberOfLines={1}>{scanResult.product.product_name}</Text>
                    <Text style={styles.productBrandMini} numberOfLines={1}>{scanResult.product.brands}</Text>
                </View>
                <View style={styles.scoreContainerMini}>
                    <Text style={[styles.scoreTextMini, { color: getScoreColor(scanResult.product.custom_score) }]}>
                        {scanResult.product.custom_score ?? '?'}
                    </Text>
                    <Text style={styles.scoreUnitMini}>/100</Text>
                    <Text style={[styles.scoreDescriptionMini, { color: getScoreColor(scanResult.product.custom_score) }]}>
                        {getScoreDescription(scanResult.product.custom_score)}
                    </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {scanResult.status === 'notFound' && (
            <View style={styles.modalContentNotFound}>
                <View style={styles.modalHandle} />
                <Text style={styles.notFoundTitle}>Produit inconnu</Text>
                <Text style={styles.notFoundSubtitle}>
                  Aidez la communauté en ajoutant ce produit à la base de données.
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    router.push({
                      pathname: '/screens/typeProd',
                      params: { barcode: scanResult.barcode },
                    });
                  }}
                >
                  <Text style={styles.addButtonText}>Compléter les informations</Text>
                </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
  scanBox: { width: 250, height: 150, borderWidth: 2, borderColor: 'white', borderRadius: 12 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  miniModalContent: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 15,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -3 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 5, 
    elevation: 20,
    minHeight: 120,
    justifyContent: 'center',
  },
  productInfoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%',
  },
  productImageMini: { width: 60, height: 60, borderRadius: 8, marginRight: 15, resizeMode: 'contain' },
  productTextContainer: { flex: 1, marginRight: 15 },
  productNameMini: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  productBrandMini: { fontSize: 13, color: '#6B7280' },
  scoreContainerMini: { 
    alignItems: 'center',
    flexDirection: 'column',
  },
  scoreTextMini: { fontSize: 24, fontWeight: 'bold' },
  scoreUnitMini: { fontSize: 10, fontWeight: 'bold', color: '#6B7280', marginTop: -4 },
  scoreDescriptionMini: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  modalContentNotFound: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 20, 
    paddingTop: 12, 
    alignItems: 'center', 
  },
  modalHandle: { width: 48, height: 6, backgroundColor: '#D1D5DB', borderRadius: 3, marginBottom: 20 },
  notFoundTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#111827' },
  notFoundSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  addButton: { backgroundColor: '#84CC16', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 99, alignItems: 'center', width: '100%' },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});