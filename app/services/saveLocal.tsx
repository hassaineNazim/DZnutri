import AsyncStorage from '@react-native-async-storage/async-storage';


export const saveToHistory = async (product: any) => {
  try {
    const existing = await AsyncStorage.getItem('scanHistory');
    console.log('Existing history:', existing);
    const history = existing ? JSON.parse(existing) : [];
    
    
    const duplic = history.some((p: any) => p.id === product.id);
    if (!duplic) {
      history.unshift(product); // add newest first
      await AsyncStorage.setItem('scanHistory', JSON.stringify(history));
    }else {
      alert('Product already exists in history, not saving again.');
    }
  } catch (err) {
    console.error('Failed to save scan:', err);
  }
};
