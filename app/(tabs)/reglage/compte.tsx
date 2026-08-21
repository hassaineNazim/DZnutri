import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Heart, Key, LogOut, Mail, Trash2, User as UserIcon } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, TouchableOpacity, View } from 'react-native';
import { BackButton } from '../../components/ui/FormKit';
import CollapsibleHeader, { useCollapsibleHeader } from '../../components/ui/CollapsibleHeader';
import Txt from '../../components/ui/Txt';
import { api } from '../../services/axios';
import { invalidateSession } from '../../services/authSession';
import { getRefreshToken } from '../../services/tokenStore';
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
    <TouchableRow onPress={onPress} label={label} value={value} last={last}>
      <IconTile tint={tint}>{icon}</IconTile>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Txt variant="semibold" size={16} color={danger ? colors.red : colors.ink}>{label}</Txt>
        {value ? <Txt variant="body" size={13} color={colors.inkSoft} style={{ marginTop: 2 }}>{value}</Txt> : null}
      </View>
      {showArrow && <ChevronRight size={20} color={colors.chevron} />}
    </TouchableRow>
  );
}

// Ligne cliquable (ou statique) avec séparateur.
function TouchableRow({
  children,
  onPress,
  label,
  value,
  last,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  label: string;
  value?: string | null;
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
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.separator,
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
  const [deleting, setDeleting] = useState(false);
  const { scrollY, onScroll } = useCollapsibleHeader();

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.log('Erreur lors de la récupération du profil', error);
      // @ts-ignore
      if (error.response && error.response.status === 401) {
        await invalidateSession('expired');
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
            await invalidateSession('logout');
          } catch (error) {
            if (__DEV__) console.log('Erreur lors de la déconnexion', error);
          }
        },
      },
    ]);
  };

  const deleteAccount = () => {
    if (deleting) return;
    Alert.alert(
      'Supprimer définitivement le compte ?',
      "Votre profil santé, votre historique, vos favoris, vos notes et vos données de compte seront supprimés. Cette action est irréversible.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer mon compte',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await api.delete('/auth/account');
              await invalidateSession('logout');
              router.replace('/auth');
            } catch (error: any) {
              Alert.alert(
                'Suppression impossible',
                error?.response?.data?.detail || 'Une erreur est survenue. Réessayez dans quelques instants.',
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
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
      <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />
      {/* ---- Entête bordeaux : avatar + identité ---- */}
      <CollapsibleHeader title="Compte" scrollY={scrollY} expandedHeight={300} compactLeft={<BackButton onPress={() => router.back()} />}>
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
      </CollapsibleHeader>

      {/* ---- Feuille crème ---- */}
      <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 324, paddingBottom: 40 }} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
          <Section title="Informations personnelles">
            <Row icon={<UserIcon size={19} color={colors.accent} />} tint="rgba(89,18,31,0.1)" label="Nom d'utilisateur" value={user?.username} />
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
              label="Réinitialiser le mot de passe"
              onPress={() =>
                router.push({
                  pathname: '/auth/forgot-password',
                  params: user?.email ? { email: user.email } : {},
                })
              }
              showArrow
            />
            <Row icon={<LogOut size={19} color={colors.red} />} tint="rgba(210,75,51,0.14)" label="Se déconnecter" onPress={logout} danger last />
          </Section>

          <Section title="Zone sensible">
            <Row
              icon={deleting ? <ActivityIndicator size="small" color={colors.red} /> : <Trash2 size={19} color={colors.red} />}
              tint="rgba(210,75,51,0.14)"
              label={deleting ? 'Suppression en cours…' : 'Supprimer mon compte'}
              value="Efface définitivement vos données personnelles"
              onPress={deleteAccount}
              danger
              last
            />
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
      <View style={[{ backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden' }, shadows.listCard]}>
        {children}
      </View>
    </View>
  );
}
