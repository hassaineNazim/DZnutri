// L'import de 'expo-barcode-scanner' a été supprimé.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Button, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { fetchProduct } from './services/openFoodFacts';
import { saveToHistory } from './services/saveLocal';



export const screenOptions = {
  headerShown: false,
};

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanned, setIsScanned] = useState(false);
 const [isModalVisible, setIsModalVisible] = useState(false);

  const closeModal = () => {
    setIsModalVisible(false);
  };

  
 
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  function handleBarCodeScanned({data }: {data: string }) {
    if(!isScanned){
      
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



  <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
       
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={closeModal}
        >
          {/* Modal Content Card */}
          <Pressable className="bg-white rounded-t-3xl p-5 pt-4 shadow-lg">
            {/* Handle */}
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-5" />
             <View className="flex-row items-center mb-6">
                 
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      Produit non trouvé
                    </Text>
                  </View>
                </View>
           

            
            

          </Pressable>
        </Pressable>
      </Modal>


    </View>
  );
}



