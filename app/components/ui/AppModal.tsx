/**
 * AppModal — remplaçant du <Modal> natif de React Native.
 *
 * Sur la nouvelle architecture Android (activée dans l'app), le Modal natif
 * rend son contenu replié en haut à gauche et sa fenêtre invisible avale les
 * touchers → app figée (constaté sur le scanner et le menu de l'accueil).
 *
 * On rend donc une superposition ABSOLUE dans la hiérarchie de l'écran :
 * mêmes props que Modal (transparent / animationType / onRequestClose sont
 * acceptées mais ignorées) pour un swap 1:1, zéro fenêtre native.
 *
 * Contrainte : à rendre comme enfant direct de la racine de l'écran (déjà le
 * cas partout) pour que l'overlay couvre tout l'écran.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

type Props = {
  visible: boolean;
  children?: React.ReactNode;
  // Compat API <Modal> — ignorés par l'overlay :
  transparent?: boolean;
  animationType?: 'none' | 'fade' | 'slide';
  statusBarTranslucent?: boolean;
  onRequestClose?: () => void;
};

export default function AppModal({ visible, children }: Props) {
  if (!visible) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]}>
      {children}
    </View>
  );
}
