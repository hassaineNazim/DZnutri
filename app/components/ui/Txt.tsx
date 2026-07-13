/**
 * Txt — petit helper typographique du redesign.
 * Évite de répéter fontFamily partout et garantit l'usage des bonnes polices
 * (Playfair Display pour les titres/chiffres, DM Sans pour le corps/UI).
 */
import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { colors, fonts } from '../../theme/tokens';

type Variant =
  | 'display' // Playfair 900 (titres écran, chiffres)
  | 'displayItalic' // Playfair 900 italic (mot accentué)
  | 'displayXBold' // Playfair 800 (intertitres, noms produit)
  | 'displayMedium' // Playfair 500
  | 'body' // DM Sans 400
  | 'medium' // DM Sans 500
  | 'semibold' // DM Sans 600
  | 'bold'; // DM Sans 700

const FAMILY: Record<Variant, string> = {
  display: fonts.displayBlack,
  displayItalic: fonts.displayBlackItalic,
  displayXBold: fonts.displayExtraBold,
  displayMedium: fonts.displayMedium,
  body: fonts.sans,
  medium: fonts.sansMedium,
  semibold: fonts.sansSemiBold,
  bold: fonts.sansBold,
};

type Props = TextProps & {
  variant?: Variant;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
};

export default function Txt({
  variant = 'body',
  size,
  color = colors.ink,
  style,
  children,
  ...rest
}: Props) {
  return (
    <Text
      {...rest}
      style={[
        { fontFamily: FAMILY[variant], color },
        size != null && { fontSize: size },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
