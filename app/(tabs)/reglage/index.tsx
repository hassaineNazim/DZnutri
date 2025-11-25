import { useRouter } from 'expo-router';
import { ChevronRight, Info, Languages, Palette, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import Dropdown from '../../components/Dropdown';
import { SupportedLang, useTranslation } from '../../i18n';

const Section = ({ title, children, delay = 0 }: { title: string, children: React.ReactNode, delay?: number }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).duration(500)}
    layout={Layout.springify()}
    className="mb-6"
  >
    <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 px-4 mb-3 uppercase tracking-wider">
      {title}
    </Text>
    <View className="bg-white dark:bg-[#1F2937] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
      {children}
    </View>
  </Animated.View>
);

const ListItem = ({ icon, label, value, onPress, children, isLast = false }: { icon?: any; label?: any; value?: any; onPress?: any; children?: any; isLast?: boolean }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress && !children}
      className={`
        flex-row items-center p-4 bg-white dark:bg-[#1F2937]
        ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}
      `}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {icon}
      <Text className="text-base font-medium text-gray-900 dark:text-gray-100 ml-4 flex-1">{label}</Text>

      <View className="flex-row items-center space-x-2">
        {value && <Text className="text-base text-gray-500 dark:text-gray-400 mr-2">{value}</Text>}
        {children}
        {onPress && !children && <ChevronRight size={20} className="text-gray-400" />}
      </View>
    </TouchableOpacity>
  );
};

export default function SettingsPage() {
  const languageData = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'العربية' },
    { value: 'fs', label: 'Système' }
  ];

  const { lang, setLanguage, t, setFollowSystem } = useTranslation();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [currentLanguage, setCurrentLanguage] = useState('');

  const toggleTheme = () => {
    setColorScheme(isDarkMode ? 'light' : 'dark');
  };

  const IconContainer = ({ children, color = "bg-gray-100 dark:bg-gray-700" }: { children?: React.ReactNode, color?: string }) => (
    <View className={`w-10 h-10 rounded-xl items-center justify-center ${color}`}>
      {children}
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-[#181A20]"
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="px-2 pt-2 pb-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('reglage') || "Réglages"}
        </Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 mt-1">
          Personnalisez votre expérience
        </Text>
      </View>

      <Section title={t('settings_language') || 'Général'} delay={100}>
        <ListItem
          icon={
            <IconContainer color="bg-blue-100 dark:bg-blue-900/30">
              <User size={20} color={isDarkMode ? '#60A5FA' : '#2563EB'} />
            </IconContainer>
          }
          label={t('account') ?? 'Compte'}
          onPress={() => router.push('/reglage/compte')}
        />

        <ListItem
          icon={
            <IconContainer color="bg-purple-100 dark:bg-purple-900/30">
              <Languages size={20} color={isDarkMode ? '#C084FC' : '#9333EA'} />
            </IconContainer>
          }
          label={t('settings_language')}
        >
          <View className="w-32">
            <Dropdown
              data={languageData}
              onChange={(item) => {
                if (item.value == 'fs') {
                  setFollowSystem(true);
                } else {
                  setFollowSystem(false);
                  setLanguage(item.value as SupportedLang);
                  setCurrentLanguage(item.label);
                }
              }}
              placeholder={lang === 'fr' ? 'Français' : lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'Langue'}
            />
          </View>
        </ListItem>

        <ListItem
          icon={
            <IconContainer color="bg-green-100 dark:bg-green-900/30">
              <Palette size={20} color={isDarkMode ? '#4ADE80' : '#16A34A'} />
            </IconContainer>
          }
          label={t('theme_dark') ?? 'Mode Sombre'}
          isLast={true}
        >
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#E5E7EB', true: '#22c55e' }}
            thumbColor={'#fff'}
          />
        </ListItem>
      </Section>

      <Section title={t('about') ?? 'À propos'} delay={200}>
        <ListItem
          icon={
            <IconContainer color="bg-orange-100 dark:bg-orange-900/30">
              <Info size={20} color={isDarkMode ? '#FB923C' : '#EA580C'} />
            </IconContainer>
          }
          label={t('who_are_we') ?? 'Qui sommes-nous ?'}
          onPress={() => router.push('/reglage/apropos')}
          isLast={true}
        />
      </Section>
    </ScrollView>
  );
}
