import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
// On importe les icônes nécessaires
import { Key, LogOut, Mail, User } from 'lucide-react-native';

// Composant réutilisable pour chaque ligne de la liste
const ListItem = ({ icon, label, value, onPress, isLast = false }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    // On utilise les classes Tailwind pour le style
    className={`flex-row items-center py-5 ${!isLast ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
  >
    {icon}
    <View className="ml-4 flex-1">
      <Text className="text-base text-gray-800 dark:text-gray-200">{label}</Text>
      {/* On n'affiche la valeur que si elle est fournie */}
      {value && (
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{value}</Text>
      )}
    </View>
  </TouchableOpacity>
);

export default function ComptePage() {
  const router = useRouter();

  // Votre fonction de déconnexion, avec une petite amélioration
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      // On utilise "replace" pour que l'utilisateur ne puisse pas revenir en arrière
      router.replace("/auth/login");
    } catch (error) {
      console.log('Erreur lors de la déconnexion', error);
    }
  };

  return (
    // Conteneur principal avec un fond blanc/noir et un padding horizontal
    <View className="flex-1 bg-white dark:bg-black px-6 pt-4">
      
      <ListItem
        icon={<User size={24} color="#8A8A8E" />}
        label="Prénom"
        value="Nazim"
        onPress={() => { /* Logique pour modifier le prénom */ }}
      />
      
      <ListItem
        icon={<Mail size={24} color="#8A8A8E" />}
        label="Email"
        value="nazimhassaine22@gmail.com"
        // Pas de onPress car l'email n'est pas modifiable
      />

      <ListItem
        icon={<Key size={24} color="#8A8A8E" />}
        label="Changer le mot de passe"
        onPress={() => { /* Logique pour naviguer vers la page de changement de mdp */ }}
      />

      <ListItem
        icon={<LogOut size={24} color="#8A8A8E" />}
        label="Se Déconnecter"
        onPress={logout} // On lie votre fonction ici
        isLast={true} // Pour ne pas afficher le séparateur en bas
      />
    </View>
  );
}