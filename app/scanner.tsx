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