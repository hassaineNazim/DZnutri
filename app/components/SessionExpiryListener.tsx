import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { subscribeToSessionEnd } from '../services/authSession';

/**
 * Garde global : toute invalidation déclenchée par l'intercepteur Axios ramène
 * immédiatement l'utilisateur vers l'authentification.
 */
export default function SessionExpiryListener() {
  const router = useRouter();

  useEffect(
    () =>
      subscribeToSessionEnd((reason) => {
        if (reason !== 'account-switch') router.replace('/auth');
      }),
    [router],
  );

  return null;
}
