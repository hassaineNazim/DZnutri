// L'import de 'expo-barcode-scanner' a été supprimé.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { fetchProduct } from './services/openFoodFacts';
import { saveToHistory } from './services/saveLocal';




export const screenOptions = {
  headerShown: false,
};

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);


  
 
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  function handleBarCodeScanned({data }: {data: string }) {
    if(!isScanned){
      alert(`Code scanné: ${data}`);
      setIsScanned(true);
fetchProduct(data)
        .then(product => {
        
        alert(`Produit trouvé: ${product.product_name}` +
          `\nMarque: ${product.brands}` +
          `\nIngrédients: ${product.ingredients_text}` +
          `\nNutri-Score: ${product.nutrition_grades}` );
          return product;
        })
        .then(product => {
          saveToHistory(product);
        })
        .catch(error => {
          console.error('Erreur lors de la récupération du produit:', error);
        });
    }
  }

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text style={{ textAlign: 'center' }}>
          Nous avons besoin de votre permission pour utiliser la caméra.
        </Text>
        <Button onPress={requestPermission} title="Donner la permission" />
      </View>
    );
  }

  // On utilise bien CameraView ici, ce qui est correct.
  return (
      <View className="flex-1 bg-black">
     
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "qr", "upc_a", "upc_e"],
        }}
      />

      <View className="absolute inset-0 justify-center items-center pointer-events-none">
        <View className="w-[250px] h-[150px] border-2 border-white rounded-xl bg-white/10" />
      </View>
    </View>
  );
}

import { StyleSheet } from 'react-native';

