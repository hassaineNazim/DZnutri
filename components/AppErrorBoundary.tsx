import * as Updates from 'expo-updates';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { clearTokens } from '../app/services/tokenStore';

type Props = { children: React.ReactNode };
type State = { error: Error | null; clearingSession: boolean };

/**
 * Dernier filet de sécurité des builds distribués : une exception de rendu ne
 * doit jamais renvoyer silencieusement le testeur sur l'écran d'accueil iOS.
 */
export default class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, clearingSession: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Erreur de rendu interceptée', error, info.componentStack);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  private clearSession = async () => {
    this.setState({ clearingSession: true });
    try {
      await clearTokens();
      await Updates.reloadAsync();
    } catch (error) {
      console.error('[AppErrorBoundary] Impossible de réinitialiser la session', error);
      this.setState({ clearingSession: false });
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Remo Scan a rencontré un problème</Text>
        <Text style={styles.message}>
          Vous pouvez réessayer ou revenir à la connexion sans supprimer l’application.
        </Text>
        <Pressable accessibilityRole="button" onPress={this.retry} style={styles.primaryButton}>
          <Text style={styles.primaryLabel}>Réessayer</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={this.state.clearingSession}
          onPress={this.clearSession}
          style={styles.secondaryButton}
        >
          {this.state.clearingSession ? (
            <ActivityIndicator color="#59121F" />
          ) : (
            <Text style={styles.secondaryLabel}>Revenir à la connexion</Text>
          )}
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4EAD6',
    paddingHorizontal: 28,
  },
  title: {
    color: '#59121F',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#62594F',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 26,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#F2C22E',
    borderRadius: 28,
    justifyContent: 'center',
    minHeight: 52,
    width: '100%',
  },
  primaryLabel: {
    color: '#1c1108',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#59121F',
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 52,
    width: '100%',
  },
  secondaryLabel: {
    color: '#59121F',
    fontSize: 15,
    fontWeight: '600',
  },
});
