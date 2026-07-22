/**
 * FormKit — primitives de formulaire au thème du redesign (bordeaux/crème/jaune).
 * Réutilisé par les écrans auth, ajout produit, réglages, etc.
 */
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import Txt from './Txt';

// Bouton retour rond crème (coin haut-gauche des écrans).
export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}
    >
      <ArrowLeft size={20} color={colors.bordeaux} />
    </Pressable>
  );
}

// Champ étiqueté (label crème + input blanc). Transmet toutes les props TextInput.
type FieldProps = TextInputProps & { label?: string };
export function Field({ label, style, ...inputProps }: FieldProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <Txt variant="medium" size={13} color={colors.rose} style={{ marginBottom: 8, marginLeft: 2 }}>
          {label}
        </Txt>
      ) : null}
      <TextInput
        placeholderTextColor={colors.inkMeta}
        {...inputProps}
        style={[
          {
            backgroundColor: colors.card,
            borderRadius: radius.cardSm,
            borderWidth: 1.5,
            borderColor: colors.border,
            paddingHorizontal: 16,
            paddingVertical: 15,
            fontSize: 15,
            color: colors.ink,
            fontFamily: fonts.sans,
          },
          style,
        ]}
      />
    </View>
  );
}

// Bouton CTA jaune (avec état de chargement).
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        { backgroundColor: colors.yellow, borderRadius: radius.cta, paddingVertical: 17, alignItems: 'center', opacity: disabled ? 0.55 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.inkOnYellow} />
      ) : (
        <Txt variant="bold" size={16} color={colors.inkOnYellow}>{label}</Txt>
      )}
    </TouchableOpacity>
  );
}

// Lien texte secondaire (centré).
export function LinkButton({ label, onPress, color }: { label: string; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ paddingVertical: 12, alignItems: 'center' }}>
      <Txt variant="semibold" size={14} color={color ?? colors.rose}>{label}</Txt>
    </TouchableOpacity>
  );
}

// Ligne d'erreur / de succès (couleurs adaptées au fond bordeaux).
export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <Txt variant="medium" size={13.5} color="#f2b6ad" style={{ textAlign: 'center', marginVertical: 2 }}>
      {children}
    </Txt>
  );
}
export function FormSuccess({ children }: { children: React.ReactNode }) {
  return (
    <Txt variant="medium" size={13.5} color="#a9dcae" style={{ textAlign: 'center', marginVertical: 2 }}>
      {children}
    </Txt>
  );
}
