import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL } from './config/api';
import { fetchProduct } from './services/openFoodFacts';
import { saveToHistory } from './services/saveLocal';

export const screenOptions = {
 headerShown: false,
};

export default function Scanner() {
 const [permission, requestPermission] = useCameraPermissions();
 const [isScanned, setIsScanned] = useState(false);
 const [isModalVisible, setIsModalVisible] = useState(false);
 const [scannedBarcode, setScannedBarcode] = useState(''); // State for the currently scanned barcode
 const [imageFrontUrl, setImageFrontUrl] = useState('');
 const [imageIngredientsUrl, setImageIngredientsUrl] = useState('');
 const [message, setMessage] = useState('');
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 // Request camera permission on component mount
 useEffect(() => {
  if (!permission?.granted) {
   requestPermission();
  }
 }, [permission]);

 // --- IMPROVEMENT: Centralized function to reset the modal and scanner state ---
 const resetFormAndCloseModal = () => {
  setIsModalVisible(false);
  setIsScanned(false); // Allow scanning again
  setScannedBarcode('');
  setImageFrontUrl('');
  setImageIngredientsUrl('');
  setMessage('');
  setLoading(false);
 };

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
     if (error === 'Product not found') {
    
      setIsModalVisible(true);
     } else {
     
      setIsModalVisible(true);
     }
    
    
    });
    } 
}
  

 const handleSubmission = async () => {
  if (!scannedBarcode || !imageFrontUrl || !imageIngredientsUrl) {
   setMessage('Erreur : Tous les champs sont obligatoires.');
   return;
  }

  setLoading(true);
  setMessage('');

  try {
   const userToken = await AsyncStorage.getItem('userToken');
   if (!userToken) {
    throw new Error('Vous devez être connecté pour soumettre un produit.');
   }

   const submissionData = {
    barcode: scannedBarcode,
    image_front_url: imageFrontUrl,
    image_ingredients_url: imageIngredientsUrl,
   };

   const response = await fetch(`${API_URL}/api/submission`, {
    method: 'POST',
     headers: {
     'Content-Type': 'application/json',
     Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify(submissionData),
   });

   const data = await response.json();

   if (response.ok) {
    // --- IMPROVEMENT: Close modal automatically on success ---
    Alert.alert(
     'Merci !',
     'Produit soumis avec succès pour validation.',
     [{ text: 'OK', onPress: resetFormAndCloseModal }]
    );
   } else {
    throw new Error(data.detail || 'Une erreur serveur est survenue.');
   }
  } catch (error) {
   setMessage(`Erreur `);
  } finally {
   setLoading(false);
  }
 };

 if (!permission) return <View />; // Loading state for permissions

 if (!permission.granted) {
  return (
   <View className="flex-1 items-center justify-center bg-white">
    <Text className="text-center p-4">
     Nous avons besoin de votre permission pour utiliser la caméra.
    </Text>
    <Button onPress={requestPermission} title="Donner la permission" />
   </View>
  );
 }

 return (
  <View className="flex-1 bg-black">
   <CameraView
    style={StyleSheet.absoluteFillObject}
    onBarcodeScanned={isScanned ? undefined : handleBarCodeScanned} // Disable scanner when processing
    barcodeScannerSettings={{
     barcodeTypes: ["ean13", "ean8", "qr", "upc_a", "upc_e"],
    }}
   />

   {/* Visual Guide for Scanner */}
   <View className="absolute inset-0 justify-center items-center pointer-events-none">
    <View className="w-[250px] h-[150px] border-2 border-white rounded-xl bg-white/10" />
   </View>

   {/* --- IMPROVEMENT: Button to allow re-scanning manually --- */}
   {isScanned && !isModalVisible && (
    <View className="absolute bottom-10 self-center">
     <TouchableOpacity
      onPress={() => setIsScanned(false)}
      className="bg-lime-500 py-3 px-6 rounded-full"
     >
      <Text className="text-white text-lg font-bold">Scanner à nouveau</Text>
     </TouchableOpacity>
    </View>
   )}

  <Modal
 visible={isModalVisible}
 transparent={true}
 animationType="slide"
 onRequestClose={resetFormAndCloseModal} // Use reset function for Android back button
>
 <Pressable
  className="flex-1 justify-end bg-black/50"
  onPress={resetFormAndCloseModal} // Use reset function when tapping background
 >
  <Pressable className="bg-white rounded-t-3xl p-5 pt-4 shadow-lg">
   <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-5" />
   <Text className="text-3xl font-bold text-gray-800 mb-8 text-center">
    Ajouter un produit
   </Text>
   
   <TextInput
    className="bg-gray-200 p-4 rounded-xl mb-4 text-base text-gray-600"
    placeholder="Code-barres"
    value={scannedBarcode}
    editable={false}
   />

   <TextInput
    className="bg-gray-100 p-4 rounded-xl mb-4 text-base text-gray-800"
    placeholder="URL de la photo de l'avant"
    placeholderTextColor="gray"
    value={imageFrontUrl}
    onChangeText={setImageFrontUrl}
    autoCapitalize="none"
   />

   <TextInput
    className="bg-gray-100 p-4 rounded-xl mb-8 text-base text-gray-800"
    placeholder="URL de la photo des ingrédients"
    placeholderTextColor="gray"
    value={imageIngredientsUrl}
    onChangeText={setImageIngredientsUrl}
        // --- FIX: The stray tab character before this line has been removed ---
    autoCapitalize="none"
   />

   {message ? (
    <Text className="text-center text-red-500 mb-4">{message}</Text>
   ) : null}

   <TouchableOpacity
    onPress={handleSubmission}
    disabled={loading}
    className="bg-lime-500 py-4 rounded-xl flex-row justify-center items-center"
   >
    {loading ? (
     <ActivityIndicator size="small" color="white" />
    ) : (
     <Text className="text-white text-lg font-bold">Soumettre le produit</Text>
    )}
   </TouchableOpacity>
  </Pressable>
 </Pressable>
</Modal>
  </View>
 );
}