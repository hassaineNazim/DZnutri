import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Key, LogOut, Mail, User as UserIcon } from 'lucide-react-native';
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from "react-native";
import { api } from "../../services/axios";

// Types
interface UserData {
  id: number;
  username: string;
  email: string | null;
}

// Composant réutilisable pour chaque ligne de la liste
const ListItem = ({ icon, label, value, onPress, isLast = false, showArrow = false }: {
  icon: React.ReactNode,
  label: string,
  value?: string | null,
  onPress?: () => void,
  isLast?: boolean,
  showArrow?: boolean
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    className={`flex-row items-center py-4 px-4 bg-white dark:bg-[#1F222A] mb-[1px] ${isLast ? 'rounded-b-2xl' : ''} ${!isLast && !onPress ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
    style={{ opacity: onPress ? 1 : 1 }}
  >
    <View className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center">
      {icon}
    </View>
    <View className="ml-4 flex-1">
      <Text className="text-base font-medium text-gray-900 dark:text-white">{label}</Text>
      {value && (
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{value}</Text>
      )}
    </View>
    {showArrow && (
      <ChevronRight size={20} color="#9CA3AF" />
    )}
  </TouchableOpacity>
);

export default function ComptePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.log('Erreur lors de la récupération du profil', error);
      // Si erreur 401, on redirige vers le login
      // @ts-ignore
      if (error.response && error.response.status === 401) {
        await AsyncStorage.removeItem('userToken');
        router.replace("/auth");
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [])
  );

  const logout = async () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              router.replace("/auth");
            } catch (error) {
              console.log('Erreur lors de la déconnexion', error);
            }
          }
        }
      ]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-[#181A20] items-center justify-center">
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#181A20]">
      {/* Header Profile Section */}
      <View className="bg-white dark:bg-[#1F222A] mb-6 rounded-b-[32px] shadow-sm pb-8 pt-4">
        <View className="flex-row items-center px-4 mb-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
          >
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-white mr-10">
            Mon Compte
          </Text>
        </View>

        <View className="items-center">
          <View className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-4 border-4 border-white dark:border-[#1F222A] shadow-sm">
            <Text className="text-3xl font-bold text-green-600 dark:text-green-400">
              {user?.username ? getInitials(user.username) : '?'}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {user?.username || 'Utilisateur'}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400">
            {user?.email || 'Aucun email'}
          </Text>
        </View>
      </View>

      {/* Settings List */}
      <View className="px-4">
        <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 ml-2 uppercase tracking-wider">
          Informations Personnelles
        </Text>

        <View className="rounded-2xl overflow-hidden bg-white dark:bg-[#1F222A] shadow-sm mb-6">
          <ListItem
            icon={<UserIcon size={20} color="#22C55E" />}
            label="Nom d'utilisateur"
            value={user?.username}
          />

          <ListItem
            icon={<Mail size={20} color="#22C55E" />}
            label="Email"
            value={user?.email}
            isLast={true}
          />
        </View>

        <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 ml-2 uppercase tracking-wider">
          Sécurité
        </Text>

        <View className="rounded-2xl overflow-hidden bg-white dark:bg-[#1F222A] shadow-sm">
          {/* Only show password change if user has a password (not google/fb) - simplified for now */}
          <ListItem
            icon={<Key size={20} color="#F59E0B" />}
            label="Changer le mot de passe"
            onPress={() => { /* TODO: Navigate to password change */ }}
            showArrow={true}
          />

          <ListItem
            icon={<LogOut size={20} color="#EF4444" />}
            label="Se Déconnecter"
            onPress={logout}
            isLast={true}
          />
        </View>
      </View>
    </View>
  );
}