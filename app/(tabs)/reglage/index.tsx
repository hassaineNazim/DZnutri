import { useRouter } from 'expo-router';
import { ChevronRight, Info, Languages, Palette, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import LanguageSelector from '../../components/LanguageSelector';
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
    { value: 'fr', label: 'Français', icon: '🇫🇷' },
    { value: 'en', label: 'English', icon: '🇬🇧' },
    { value: 'ar', label: 'العربية', icon: '🇩🇿' },
    { value: 'fs', label: 'Système', icon: '📱' }
  ];

  const { lang, setLanguage, t, setFollowSystem, follow } = useTranslation();
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  const toggleTheme = () => {
    setColorScheme(isDarkMode ? 'light' : 'dark');
  };

  const handleLanguageSelect = async (value: string) => {
    setSelectorVisible(false);

    // Show restarting modal immediately to give feedback
    // We might want to delay this slightly if the transition is too abrupt, 
    // but usually immediate feedback is better.

    let result;
    if (value === 'fs') {
      if (follow) return; // Already following system
      setIsRestarting(true);
      result = await setFollowSystem(true);
    } else {
      if (lang === value && !follow) return; // Already selected
      setIsRestarting(true);
      await setFollowSystem(false); // Disable follow system first
      result = await setLanguage(value as SupportedLang);
    }

    // If reload didn't happen automatically (e.g. in dev client without updates), 
    // we keep the modal open or show a manual restart prompt.
    // But since our i18n logic returns { needsRestart: boolean }, we can handle it.

    if (result.needsRestart) {
      // Keep the modal open, maybe change text to "Please restart app"
      // For now, we just keep the spinner which implies "working on it"
      // In a real app, you might want a button "Restart Now" if programmatic restart fails.
      setTimeout(() => setIsRestarting(false), 3000); // Fallback timeout
    } else {
      setIsRestarting(false);
    }
  };

  const getCurrentLabel = () => {
    if (follow) return 'Système';
    const found = languageData.find(l => l.value === lang);
    return found ? found.label : lang;
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
          {t('settings_description') || "Personnalisez votre expérience"}
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
          value={getCurrentLabel()}
          onPress={() => setSelectorVisible(true)}
        />

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

      <LanguageSelector
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
        onSelect={handleLanguageSelect}
        currentLanguage={follow ? 'fs' : lang}
        languages={languageData}
      />

      {/* Restarting Modal */}
      <Modal
        transparent
        visible={isRestarting}
        animationType="fade"
      >
        <View className="flex-1 bg-black/80 items-center justify-center">
          <View className="bg-white dark:bg-[#1F2937] p-8 rounded-3xl items-center shadow-2xl">
            <ActivityIndicator size="large" color="#10B981" className="mb-6" />
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {lang === 'ar' ? 'جاري تغيير اللغة...' : 'Changing language...'}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">
              {lang === 'ar'
                ? 'جاري إعادة التشغيل... إذا لم يحدث شيء، يرجى إعادة تشغيل التطبيق يدوياً لتطبيق التغييرات.'
                : 'Restarting... If nothing happens, please restart the app manually to apply changes.'}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setIsRestarting(false);
              }}
              className="bg-gray-200 dark:bg-gray-700 px-6 py-3 rounded-xl"
            >
              <Text className="font-bold text-gray-900 dark:text-white">
                {lang === 'ar' ? 'إغلاق النافذة' : 'Close Window'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}
