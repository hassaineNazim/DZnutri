// Dans app/(tabs)/reglage/index.tsx

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
// On importe les icônes nécessaires de lucide-react-native
import { ChevronRight, Info, Languages, Palette, User } from 'lucide-react-native';
// On importe le hook de NativeWind pour gérer le thème (clair/sombre)
import { useColorScheme } from 'nativewind';
import Dropdown from '../../components/Dropdown'; // Assurez-vous que le chemin est correct

/**
 * Composant Section
 * Regroupe visuellement les paramètres dans des cartes pour une meilleure organisation.
 * @param {object} props - Les propriétés du composant.
 * @param {string} props.title - Le titre de la section.
 * @param {React.ReactNode} props.children - Les éléments enfants (généralement des ListItems).
 */
const Section = ({ title, children }) => (
  <View className="mb-6">
    {/* Titre de la section, en majuscules pour le style */}
    <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 px-4 mb-2 uppercase">
      {title}
    </Text>
    {/* Conteneur de la section avec des bordures et coins arrondis */}
    <View className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-900">
      {children}
    </View>
  </View>
);

/**
 * Composant ListItem
 * Représente une ligne cliquable dans une liste de réglages. Il est flexible
 * et peut afficher une valeur, une flèche, ou un composant enfant comme un Switch.
 * NOTE: Pour un projet plus grand, il serait préférable de déplacer ce composant
 * dans son propre fichier (ex: /components/ListItem.tsx).
 */
const ListItem = ({ icon, label, value, onPress, children, isLast = false }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !children} // L'élément n'est pas cliquable s'il n'y a pas d'action ou d'enfant interactif
      className={`
        flex-row items-center p-4 bg-white dark:bg-neutral-800
        ${!isLast ? 'border-b border-gray-200 dark:border-gray-900' : ''}
      `}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Icône du réglage */}
      {icon}

      {/* Titre du réglage */}
      <Text className="text-base text-gray-900 dark:text-gray-100 ml-4 flex-1">{label}</Text>

      {/* Contenu à droite (valeur, flèche, ou composant enfant comme un Switch) */}
      <View className="flex-row items-center space-x-2">
        {value && <Text className="text-base text-gray-500 dark:text-gray-400">{value}</Text>}
        {children}
        {/* Affiche la flèche seulement si l'élément est cliquable et n'a pas d'enfant */}
        {onPress && !children && <ChevronRight size={20} className="text-gray-400" />}
      </View>
    </TouchableOpacity>
  );
};


export default function SettingsPage() {
  const languageData = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'Anglais' },
    { value: 'ar', label: 'Arabe' },
  ];
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Simule la récupération de la langue actuelle.
  // Dans une vraie application, cette valeur viendrait de AsyncStorage ou d'un state manager.
  const [currentLanguage, setCurrentLanguage] = useState('Français');

  const toggleTheme = () => {
    setColorScheme(isDarkMode ? 'light' : 'dark');
  };

  // Un composant conteneur pour les icônes afin de standardiser leur style.
  const IconContainer = ({ children }) => (
    <View className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 items-center justify-center">
      {children}
    </View>
  );

  return (
  
    <ScrollView 
      className="flex-1 bg-gray-50 dark:bg-black"
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 32 }}
      showsVerticalScrollIndicator={false}
    >
   

      <Section title="Général">
        <ListItem
          icon={
            <IconContainer>
              {/* L'icône utilise les classes de NativeWind pour s'adapter au thème */}
              <User size={20} className="text-gray-700 dark:text-gray-200" />
            </IconContainer>
          }
          label="Compte"
          onPress={() => router.push('/reglage/compte')}
        />
<ListItem
          icon={<IconContainer><Languages size={20} className="text-gray-700 dark:text-gray-200" /></IconContainer>}
          label="Langue"
        >
          {/* Le Dropdown est maintenant un enfant du ListItem */}
          <Dropdown
            data={languageData}
            onChange={(item) => {
              console.log("Langue sélectionnée:", item);
              // Ici, vous mettriez à jour la langue dans votre application (ex: i18n, AsyncStorage)
            }}
            placeholder="Choisir"
          />
        </ListItem>
        <ListItem
          icon={
            <IconContainer>
              <Palette size={20} className="text-gray-700 dark:text-gray-200" />
            </IconContainer>
          }
          label="Thème sombre"
          isLast={true} // Indique que c'est le dernier élément de la section
        >
          {/* Le Switch est maintenant un enfant du ListItem, ce qui est plus propre et sémantique */}
          <Switch
          className=''
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#E5E7EB', true: '#22c55e' }}
            thumbColor={isDarkMode ? '#f4f3f4' : '#f4f3f4'}
          />
        </ListItem>
      </Section>

      <Section title="À propos">
        <ListItem
          icon={
            <IconContainer>
              <Info size={20} className="text-gray-700 dark:text-gray-200" />
            </IconContainer>
          }
          label="Qui sommes-nous ?"
          onPress={() => router.push('/reglage/apropos')}
          isLast={true}
        />
      </Section>
    </ScrollView>
  );
}
