import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/api';


const api = axios.create({
  baseURL: API_URL, 
});

api.interceptors.request.use(
  async (config) => {
    
    const userToken = await AsyncStorage.getItem('userToken');
    
    if (userToken) {
     
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    
    return config; 
  },
  (error) => {
    
    return Promise.reject(error);
  }
);


export { api };
