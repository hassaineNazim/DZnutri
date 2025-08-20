<<<<<<< HEAD
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
  const router = useRouter();

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (isScanned) return;
    setIsScanned(true);
    // On navigue immédiatement vers la page de résultat
    router.push({
  pathname: '/scan-result/[barcode]',
  params: { barcode: data },
});
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Permission caméra requise.</Text>
        <Button onPress={requestPermission} title="Donner la permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={isScanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8'] }}
      />
      <View style={styles.overlay}>
        <View style={styles.scanBox} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanBox: { width: 250, height: 150, borderWidth: 2, borderColor: 'white', borderRadius: 12 },
});
=======
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { API_URL } from './config/api';
import { fetchProduct } from './services/openFoodFacts';
import { saveToHistory } from './services/saveLocal';

export const screenOptions = {
 headerShown: false,
};

type Product = {
  id: string;
  product_name?: string;
  brands?: string;
  image_small_url?: string;
  nutrition_grades?: string;
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
 const [product, setProduct] = useState<Product[]>([]); // State for the fetched product
 const [isProdModalVisible, setIsProdModalVisible] = useState(false);
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
  
   setIsScanned(true);
      fetchProduct(data)
    .then(product => {
if (product === null || product === undefined) {
  setIsModalVisible(true);
  return product;
}
     setIsProdModalVisible(true);
     setProduct(product);
     return product;
    })
    .then(product => {
     saveToHistory(product);
    })
    .catch(error => {
     
        console.error('Error fetching product:', error);
        setIsModalVisible(true); 
        setIsProdModalVisible(false);
    
   
    
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
 visible={isProdModalVisible}
 transparent={true}
 animationType="slide"
 onRequestClose={() => setIsProdModalVisible(false)} // Use reset function for Android back button
>
  { isProdModalVisible &&  product && (
 <Pressable
  className="flex-1 justify-end bg-black/50"
  onPress={() => setIsProdModalVisible(false)} // Use reset function when tapping background
 >

  <Pressable className="bg-white rounded-t-3xl p-5 pt-4 shadow-lg dark:bg-[#181A20]">
   <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-5 flex-row dark:bg-[#181A20]" />
  <Image
                    source={{  uri: product.image_small_url }}
                    className="w-16 h-16 rounded-md mr-4"
                  />
    <Text className="text-lg font-bold mb-2 dark:text-white">{product.product_name}</Text>
  </Pressable>
 </Pressable>)}
</Modal>
 



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
  <Pressable className="bg-white rounded-t-3xl p-5 pt-4 shadow-lg dark:bg-[#181A20]">
   <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-5" />
    <Text className="text-lg font-bold mb-2 dark:text-white">Produit non trouvé</Text>
    <Pressable
     className="bg-lime-500 py-3 px-6 rounded-full mb-4 dark:bg-green-500 items-center "
     onPress={() => {
       router.push('../screens/ajouterProd', )
     
     }}
   ><Text className="text-white font-bold mb-2 ">Ajouter un produit</Text></Pressable>
  </Pressable>
 </Pressable>
</Modal>


  </View>
 );
}
>>>>>>> 1548a302fa01d99e5e0bbf3823f52bbce6957942
