import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StatusBar, Switch, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import LanguageSelector from '../../components/LanguageSelector';
import { useTheme } from '../../theme/ThemeContext';
import AppModal from '../../components/ui/AppModal';
import CollapsibleHeader, { AnimatedScrollView, useCollapsibleHeader } from '../../components/ui/CollapsibleHeader';
import Txt from '../../components/ui/Txt';
import { API_URL } from '../../config/api';
import { SupportedLang, useTranslation } from '../../i18n';
import { colors, radius, shadows } from '../../theme/tokens';

const languageData = [
  { value: 'fr', label: 'Français', icon: '🇫🇷' },
  { value: 'en', label: 'English', icon: '🇬🇧' },
  { value: 'ar', label: 'العربية', icon: '🇩🇿' },
  { value: 'fs', label: 'Système', icon: '📱' },
];

// --- Icônes (dessinées à la main, style plein fidèle au handoff) ------------
function IconArrowLeft({ color = colors.bordeaux }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M13 5l-7 7 7 7M6 12h13" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function IconProfile({ color = colors.bordeaux }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
      <Path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function IconUserFill({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={4.2} fill={color} />
      <Path d="M4 20.5a8 8 0 0 1 16 0 1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" fill={color} />
    </Svg>
  );
}
function IconGlobeFill({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-3.2a15.7 15.7 0 0 0-1.1-5.3A8 8 0 0 1 18.9 11zM12 4.2c.9 1 1.7 3.1 1.9 6.8h-3.8c.2-3.7 1-5.8 1.9-6.8zM8.3 5.7A15.7 15.7 0 0 0 7.3 11H4.1a8 8 0 0 1 4.2-5.3zM4.1 13h3.2a15.7 15.7 0 0 0 1.1 5.3A8 8 0 0 1 4.1 13zm7.9 6.8c-.9-1-1.7-3.1-1.9-6.8h3.8c-.2 3.7-1 5.8-1.9 6.8zm3.7-1.5a15.7 15.7 0 0 0 1.1-5.3h3.2a8 8 0 0 1-4.3 5.3z"
      />
    </Svg>
  );
}
function IconStarFill({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path fill={color} d="M12 4l2.5 5.1 5.6.8-4.1 4 1 5.6L12 16.9 6.9 19.5l1-5.6-4.1-4 5.6-.8z" />
    </Svg>
  );
}
function IconMoonFill({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24">
      <Path fill={color} d="M21.6 13a9 9 0 1 1-10.6-10 7.2 7.2 0 0 0 10.6 10z" />
    </Svg>
  );
}
function IconInfo({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path d="M12 11v5M12 8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function IconShield({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function IconDoc({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12h6M9 16h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
function Chevron() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={colors.chevron} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// --- Primitives d'affichage -------------------------------------------------
function RoundBtn({ children, onPress, label }: { children: React.ReactNode; onPress?: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </Pressable>
  );
}

function IconTile({ tint, children }: { tint: string; children: React.ReactNode }) {
  return (
    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

function Row({
  tile,
  label,
  value,
  onPress,
  right,
  last = false,
}: {
  tile: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}${value ? `, ${value}` : ''}`}
      activeOpacity={onPress ? 0.65 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.separator,
      }}
    >
      {tile}
      <Txt variant="semibold" size={16} color={colors.ink} style={{ flex: 1 }}>{label}</Txt>
      {value ? <Txt variant="semibold" size={13} color={colors.inkSoft} style={{ marginRight: 2 }}>{value}</Txt> : null}
      {right ?? <Chevron />}
    </TouchableOpacity>
  );
}

export default function SettingsPage() {
  const { lang, setLanguage, t, setFollowSystem, follow } = useTranslation();
  const router = useRouter();
  const { isDark: isDarkMode, setScheme } = useTheme();

  const [selectorVisible, setSelectorVisible] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const { scrollY, onScroll } = useCollapsibleHeader();

  const currentLangLabel = useMemo(() => {
    if (follow) return languageData.find((l) => l.value === 'fs')?.label ?? 'Système';
    return languageData.find((l) => l.value === lang)?.label ?? 'Français';
  }, [follow, lang]);

  const toggleTheme = () => setScheme(isDarkMode ? 'light' : 'dark');

  const handleLanguageSelect = async (value: string) => {
    setSelectorVisible(false);
    let result;
    if (value === 'fs') {
      if (follow) return;
      setIsRestarting(true);
      result = await setFollowSystem(true);
    } else {
      if (lang === value && !follow) return;
      setIsRestarting(true);
      await setFollowSystem(false);
      result = await setLanguage(value as SupportedLang);
    }
    if (result.needsRestart) {
      setTimeout(() => setIsRestarting(false), 3000);
    } else {
      setIsRestarting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />
      {/* ---- Entête bordeaux ---- */}
      <CollapsibleHeader
        title={t('settings_title') || 'Réglages'}
        scrollY={scrollY}
        expandedHeight={240}
        compactLeft={<RoundBtn label={t('back')} onPress={() => router.back()}><IconArrowLeft /></RoundBtn>}
        compactRight={<RoundBtn label={t('account')} onPress={() => router.push('/reglage/compte')}><IconProfile /></RoundBtn>}
      >
      <View style={{ paddingHorizontal: 26, paddingTop: 18, paddingBottom: 26 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <RoundBtn label={t('back')} onPress={() => router.back()}>
            <IconArrowLeft />
          </RoundBtn>
          <RoundBtn label={t('account')} onPress={() => router.push('/reglage/compte')}>
            <IconProfile />
          </RoundBtn>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 20 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt variant="bold" size={12} color={colors.yellow} style={{ letterSpacing: 1.2 }}>
              {(t('my_account') || 'Mon compte').toUpperCase()}
            </Txt>
            <Txt variant="display" size={46} color={colors.creamTitle} style={{ marginTop: 4, letterSpacing: -0.5 }}>
              {t('settings_title') || 'Réglages'}
            </Txt>
            <Txt variant="body" size={14} color={colors.rose} style={{ marginTop: 12, lineHeight: 21 }}>
              {t('settings_description') || 'Personnalisez votre expérience.'}
            </Txt>
          </View>
          <Image
            source={require('../../../assets/images/mascotte-mecano.png')}
            style={{ width: 86, height: 86, marginTop: -2, resizeMode: 'contain' }}
          />
        </View>
      </View>
      </CollapsibleHeader>

      {/* ---- Feuille crème ---- */}
      <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
        <AnimatedScrollView contentContainerStyle={{ padding: 22, paddingTop: 264, paddingBottom: 120 }} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
          {/* PRÉFÉRENCES */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <Txt variant="bold" size={11.5} color={colors.inkSoft} style={{ letterSpacing: 1.5, marginBottom: 12 }}>
              {(t('preferences') || 'Préférences').toUpperCase()}
            </Txt>
            <View style={[{ backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden' }, shadows.listCard]}>
              <Row
                tile={<IconTile tint="rgba(89,18,31,0.1)"><IconUserFill color={colors.accent} /></IconTile>}
                label={t('account') || 'Compte'}
                onPress={() => router.push('/reglage/compte')}
              />
              <Row
                tile={<IconTile tint="rgba(242,194,46,0.2)"><IconGlobeFill color="#b98a09" /></IconTile>}
                label={t('settings_language') || 'Langue'}
                value={currentLangLabel}
                onPress={() => setSelectorVisible(true)}
              />
              <Row
                tile={<IconTile tint="rgba(210,75,51,0.14)"><IconStarFill color={colors.red} /></IconTile>}
                label={t('favorites') || 'Favoris'}
                onPress={() => router.push('/screens/FavoritesScreen')}
              />
              <Row
                tile={<IconTile tint="rgba(79,158,90,0.16)"><IconMoonFill color={colors.green} /></IconTile>}
                label={t('theme_dark') || 'Thème sombre'}
                last
                right={
                  <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    accessibilityRole="switch"
                    accessibilityLabel={t('theme_dark')}
                    accessibilityState={{ checked: isDarkMode }}
                    trackColor={{ false: colors.handle, true: colors.green }}
                    thumbColor={colors.white}
                  />
                }
              />
            </View>
          </Animated.View>

          {/* À PROPOS */}
          <Animated.View entering={FadeInDown.delay(120).duration(400)}>
            <Txt variant="bold" size={11.5} color={colors.inkSoft} style={{ letterSpacing: 1.5, marginTop: 24, marginBottom: 12 }}>
              {(t('about') || 'À propos').toUpperCase()}
            </Txt>
            <View style={[{ backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden' }, shadows.listCard]}>
              <Row
                tile={<IconTile tint="rgba(240,138,60,0.16)"><IconInfo color={colors.orange} /></IconTile>}
                label={t('who_are_we') || 'Qui sommes-nous ?'}
                onPress={() => router.push('/reglage/apropos')}
              />
              <Row
                tile={<IconTile tint="rgba(89,18,31,0.1)"><IconShield color={colors.accent} /></IconTile>}
                label={t('privacy_policy') || 'Politique de confidentialité'}
                onPress={() => Linking.openURL(`${API_URL}/legal/privacy`)}
              />
              <Row
                tile={<IconTile tint="rgba(139,128,115,0.16)"><IconDoc color={colors.inkSoft} /></IconTile>}
                label={t('terms_of_service') || "Conditions d'utilisation"}
                onPress={() => Linking.openURL(`${API_URL}/legal/terms`)}
                last
              />
            </View>
          </Animated.View>

          <Txt variant="body" size={12} color={colors.inkMeta} style={{ textAlign: 'center', marginTop: 20 }}>
            Remo Scan · v2.0
          </Txt>
        </AnimatedScrollView>
      </View>

      <LanguageSelector
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
        onSelect={handleLanguageSelect}
        currentLanguage={follow ? 'fs' : lang}
        languages={languageData}
      />

      {/* Modale « changement de langue » — AppModal : le Modal natif figeait l'app. */}
      <AppModal transparent visible={isRestarting} animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(20,17,16,0.8)', alignItems: 'center', justifyContent: 'center', padding: 30 }}>
          <View style={[{ backgroundColor: colors.sheet, borderRadius: 28, padding: 30, alignItems: 'center', maxWidth: 340 }, shadows.resultCard]}>
            <ActivityIndicator size="large" color={colors.green} />
            <Txt variant="displayXBold" size={20} color={colors.ink} style={{ marginTop: 18, textAlign: 'center' }}>
              {lang === 'ar' ? 'جاري تغيير اللغة...' : 'Changing language...'}
            </Txt>
            <Txt variant="body" size={13.5} color={colors.inkSoft} style={{ marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
              {lang === 'ar'
                ? 'جاري إعادة التشغيل... إذا لم يحدث شيء، يرجى إعادة تشغيل التطبيق يدوياً.'
                : 'Restarting... If nothing happens, please restart the app manually.'}
            </Txt>
            <TouchableOpacity
              onPress={() => setIsRestarting(false)}
              accessibilityRole="button"
              accessibilityLabel={t('close')}
              activeOpacity={0.85}
              style={{ marginTop: 20, backgroundColor: colors.bordeauxSoft, borderRadius: radius.cta, paddingVertical: 13, paddingHorizontal: 26 }}
            >
              <Txt variant="bold" size={15} color={colors.accent}>
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </Txt>
            </TouchableOpacity>
          </View>
        </View>
      </AppModal>
    </View>
  );
}
