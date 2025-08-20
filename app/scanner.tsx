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
import { fetchProduct } from './services/openFoodFacts';
import { saveToHistory } from './services/saveLocal';

type Product = {
  id: string;
  product_name?: string;
  brands?: string;
  image_small_url?: string;
  nutrition_grades?: string;
};

// On utilise un seul état pour gérer le résultat du scan
type ScanResult = 
  | { status: 'scanning' }
  | { status: 'loading' }
  | { status: 'found', product: Product }
  | { status: 'notFound', barcode: string };

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
    if (scanResult.status !== 'scanning') return; // Bloque si un scan est en cours
    
    setScanResult({ status: 'loading' }); // Affiche le chargement

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
          <Pressable style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            {/* Affiche le contenu en fonction du résultat */}
            {scanResult.status === 'found' && (
              <View style={styles.productInfoContainer}>
                {scanResult.product.image_small_url && (
                  <Image source={{ uri: scanResult.product.image_small_url }} style={styles.productImage} />
                )}
                <Text style={styles.productName}>{scanResult.product.product_name}</Text>
              </View>
            )}

            {scanResult.status === 'notFound' && (
              <>
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
              </>
            )}
          </Pressable>
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
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.0)' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingTop: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 20 },
  modalHandle: { width: 48, height: 6, backgroundColor: '#D1D5DB', borderRadius: 3, marginBottom: 20 },
  productInfoContainer: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  productImage: { width: 64, height: 64, borderRadius: 8, marginRight: 16 },
  productName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  notFoundTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#111827' },
  notFoundSubtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  addButton: { backgroundColor: '#84CC16', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 99, alignItems: 'center', width: '100%' },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});