import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { BookMarked, Home, ScanLine, Search, User } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from '../i18n';
import { colors, radius, shadows } from '../theme/tokens';
import Txt from './ui/Txt';

// Mapping route -> icône + libellé (design : Accueil, Rechercher, Carnet, Moi).
const ROUTE_META: Record<string, { icon: any; labelKey: string; fallback: string }> = {
  historique: { icon: Home, labelKey: 'home', fallback: 'Accueil' },
  rech: { icon: Search, labelKey: 'search', fallback: 'Rechercher' },
  analyse: { icon: BookMarked, labelKey: 'carnet', fallback: 'Carnet' },
  reglage: { icon: User, labelKey: 'me', fallback: 'Moi' },
};

export function BottomNavBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 18,
        paddingTop: 10,
        paddingBottom: 12,
      }}
    >
      <View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            backgroundColor: colors.navBordeaux,
            borderRadius: radius.pill + 2,
            paddingHorizontal: 14,
            paddingVertical: 14,
          },
          shadows.nav,
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = ROUTE_META[route.name];
          if (!meta) return null;
          const Icon = meta.icon;
          const color = isFocused ? colors.yellow : '#ecdcc4';

          const onPress = () => {
            if (!isFocused) navigation.navigate(route.name);
          };

          const tab = (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityLabel={t(meta.labelKey) || meta.fallback}
              accessibilityState={{ selected: isFocused }}
              style={{ flex: 1, alignItems: 'center', gap: 6 }}
            >
              <Icon size={24} color={color} strokeWidth={1.8} />
              <Txt variant={isFocused ? 'bold' : 'medium'} size={11} color={color}>
                {t(meta.labelKey) || meta.fallback}
              </Txt>
            </Pressable>
          );

          // Bouton Scanner central surélevé, inséré au milieu (après 2 onglets).
          if (index === 1) {
            return (
              <React.Fragment key="scan-fragment">
                {tab}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Pressable
                    onPress={() => router.push('/scanner')}
                    accessibilityRole="button"
                    accessibilityLabel={t('scan_product')}
                    style={[
                      {
                        width: 62,
                        height: 62,
                        borderRadius: 31,
                        backgroundColor: colors.yellow,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: -34,
                      },
                      shadows.scanButton,
                    ]}
                  >
                    <ScanLine size={27} color={colors.navBordeaux} strokeWidth={2} />
                  </Pressable>
                  <Txt variant="bold" size={11} color={colors.yellow} style={{ marginTop: 6 }}>
                    {t('scan') || 'Scanner'}
                  </Txt>
                </View>
              </React.Fragment>
            );
          }

          return tab;
        })}
      </View>
    </View>
  );
}

export default BottomNavBar;
