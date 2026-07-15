import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Heart, Key, LogOut, Mail, User as UserIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { BackButton } from '../../components/ui/FormKit';
import Txt from '../../components/ui/Txt';
import { api } from '../../services/axios';
import { clearTokens, getRefreshToken } from '../../services/tokenStore';
import { colors, radius, shadows } from '../../theme/tokens';

interface UserData {
  id: number;
  username: string;
  email: string | null;
}

function IconTile({ tint, children }: { tint: string; children: React.ReactNode }) {
  return (
    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

function Row({
  icon,
  tint,
  label,
  value,
  onPress,
  danger = false,
  showArrow = false,
  last = false,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  value?: string | null;
  onPress?: () => void;
  danger?: boolean;
  showArrow?: boolean;
  last?: boolean;
}) {
  return (
    <TouchableRow onPress={onPress} last={last}>
      <IconTile tint={tint}>{icon}</IconTile>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Txt variant="semibold" size={16} color={danger ? colors.red : colors.ink}>{label}</Txt>
        {value ? <Txt variant="body" size={13} color={colors.inkSoft} style={{ marginTop: 2 }}>{value}</Txt> : null}
      </View>
      {showArrow && <ChevronRight size={20} color="#c3b8a6" />}
    </TouchableRow>
  );
}

// Ligne cliquable (ou statique) avec séparateur.
function TouchableRow({ children, onPress, last }: { children: React.ReactNode; onPress?: () => void; last?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.65 : 1}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: '#f1e9d8',
      }}
    >
      {children}
    </TouchableOpacity>
  );
}

export default function ComptePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.log('Erreur lors de la récupération du profil', error);
      // @ts-ignore
      if (error.response && error.response.status === 401) {
        await clearTokens();
        router.replace('/auth');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [fetchUser]),
  );

  const logout = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          try {
            const refreshToken = await getRefreshToken();
            if (refreshToken) {
              try { await api.post('/auth/logout', { refresh_token: refreshToken }); } catch {}
            }
            await clearTokens();
            router.replace('/auth');
          } catch (error) {
            if (__DEV__) console.log('Erreur lors de la déconnexion', error);
          }
        },
      },
    ]);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((word) => word[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bordeaux, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
      {/* ---- Entête bordeaux : avatar + identité ---- */}
      <View style={{ paddingHorizontal: 26, paddingTop: 18, paddingBottom: 28 }}>
        <BackButton onPress={() => router.back()} />
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="display" size={34} color={colors.inkOnYellow}>
              {user?.username ? getInitials(user.username) : '?'}
            </Txt>
          </View>
          <Txt variant="display" size={26} color={colors.creamTitle} style={{ marginTop: 14 }}>
            {user?.username || 'Utilisateur'}
          </Txt>
          <Txt variant="body" size={14} color={colors.rose} style={{ marginTop: 4 }}>
            {user?.email || 'Aucun email'}
          </Txt>
        </View>
      </View>

      {/* ---- Feuille crème ---- */}
      <View style={{ flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Section title="Informations personnelles">
            <Row icon={<UserIcon size={19} color={colors.bordeaux} />} tint="rgba(89,18,31,0.1)" label="Nom d'utilisateur" value={user?.username} />
            <Row icon={<Mail size={19} color="#b98a09" />} tint="rgba(242,194,46,0.2)" label="Email" value={user?.email} last />
          </Section>

          <Section title="Santé & préférences">
            <Row
              icon={<Heart size={19} color={colors.red} />}
              tint="rgba(210,75,51,0.14)"
              label="Profil Santé"
              value="Allergies, Régime..."
              onPress={() => router.push('/(tabs)/reglage/profile-sante')}
              showArrow
              last
            />
          </Section>

          <Section title="Sécurité">
            <Row
              icon={<Key size={19} color={colors.orange} />}
              tint="rgba(240,138,60,0.16)"
              label="Changer le mot de passe"
              onPress={() => { /* TODO */ }}
              showArrow
            />
            <Row icon={<LogOut size={19} color={colors.red} />} tint="rgba(210,75,51,0.14)" label="Se déconnecter" onPress={logout} danger last />
          </Section>
        </ScrollView>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Txt variant="bold" size={11.5} color={colors.inkSoft} style={{ letterSpacing: 1.5, marginBottom: 12 }}>
        {title.toUpperCase()}
      </Txt>
      <View style={[{ backgroundColor: colors.white, borderRadius: radius.card, overflow: 'hidden' }, shadows.listCard]}>
        {children}
      </View>
    </View>
  );
}
