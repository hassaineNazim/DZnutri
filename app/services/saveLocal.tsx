import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToHistory = async (product: any) => {
  // 1. Guard Clause: Ensure the product and its unique key are valid.
  if (!product || !product.code) {
    console.log('Attempted to save an invalid product. Aborting.');
    return; // Exit the function early
  }

  try {
    const existing = await AsyncStorage.getItem('scanHistory');
    const history = existing ? JSON.parse(existing) : [];
    
    // 2. Standardized Check: Use 'code' to check for duplicates for consistency.
    const isDuplicate = history.some((p: any) => p?.code === product.code);

    if (!isDuplicate) {
      history.unshift(product); // Add newest item to the front
      await AsyncStorage.setItem('scanHistory', JSON.stringify(history));
    } else {
      // (Optional) A console log is often better than an alert for background tasks.
      console.log('Product already exists in history, not saving again.');
    }
  } catch (err) {
    console.error('Failed to save scan:', err);
  }
};