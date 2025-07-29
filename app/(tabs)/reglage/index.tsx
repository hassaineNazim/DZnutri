// Dans app/(tabs)/reglage/index.tsx

import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
// On importe les icônes nécessaires pour cette page
import { Info, Languages, Palette, User } from 'lucide-react-native';

// On réutilise EXACTEMENT le même composant ListItem pour un design cohérent
const ListItem = ({ icon, label, value, onPress, isLast = false }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    className={`flex-row items-center py-5 ${!isLast ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}
  >
    {icon}
    <View className="ml-4 flex-1">
      <Text className="text-base text-gray-800 dark:text-gray-200">{label}</Text>
      {value && (
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">{value}</Text>
      )}
    </View>
  </TouchableOpacity>
);

// Le nom de la fonction est maintenant "SettingsPage" pour correspondre à la page principale des réglages
export default function SettingsPage() {
  const router = useRouter();

  return (
    // Conteneur principal identique à celui de la page Compte
    <View className="flex-1 bg-white dark:bg-black px-6 pt-4">
      
      <ListItem
        icon={<User size={24} color="#8A8A8E" />}
        label="Compte"
        // On utilise router.push pour naviguer vers la page correspondante
        onPress={() => router.push('/reglage/compte')}
      />
      
      <ListItem
        icon={<Languages size={24} color="#8A8A8E" />}
        label="Langage"
        onPress={() => router.push('/reglage/langage')} // Assurez-vous de créer le fichier langage.tsx
      />

      <ListItem
        icon={<Palette size={24} color="#8A8A8E" />}
        label="Changer le thème"
        onPress={() => { /* Logique pour changer le thème (ex: via un toggle) */ }}
      />

      <ListItem
        icon={<Info size={24} color="#8A8A8E" />}
        label="Qui somme nous ?"
        onPress={() => router.push('/reglage/apropos')} // Assurez-vous de créer le fichier apropos.tsx
        isLast={true} 
      />
    </View>
  );
}