import { persister, queryClient } from './queryClient';
import { clearTokens, saveTokens } from './tokenStore';

export type SessionEndReason = 'expired' | 'logout' | 'account-switch';
export type TokenPair = { access_token?: string; refresh_token?: string };

type SessionEndListener = (reason: SessionEndReason) => void;

const sessionEndListeners = new Set<SessionEndListener>();
let invalidationPromise: Promise<void> | null = null;

export function subscribeToSessionEnd(listener: SessionEndListener) {
  sessionEndListeners.add(listener);
  return () => {
    sessionEndListeners.delete(listener);
  };
}

async function clearPrivateClientState() {
  queryClient.clear();
  await persister.removeClient();
}

function notifySessionEnd(reason: SessionEndReason) {
  sessionEndListeners.forEach((listener) => listener(reason));
}

/**
 * Démarre une session sans jamais réutiliser le cache privé du compte précédent.
 */
export async function startSession(tokens: TokenPair) {
  await clearPrivateClientState();
  await clearTokens();
  // Annule aussi les effets asynchrones liés au compte précédent (notifications
  // différées, identifiants déjà traités, etc.) sans provoquer de redirection.
  notifySessionEnd('account-switch');
  await saveTokens(tokens);
}

/**
 * Termine la session de façon atomique : jetons + cache mémoire + cache persistant,
 * puis avertit le garde de navigation monté à la racine.
 */
export async function invalidateSession(reason: SessionEndReason = 'expired') {
  if (!invalidationPromise) {
    invalidationPromise = (async () => {
      await clearTokens();
      await clearPrivateClientState();
      notifySessionEnd(reason);
    })().finally(() => {
      invalidationPromise = null;
    });
  }

  await invalidationPromise;
}
