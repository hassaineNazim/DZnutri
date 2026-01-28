import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes (data is considered fresh for 5 mins)
            gcTime: 1000 * 60 * 60 * 24, // 24 hours (data is kept in cache for 24 hours)
        },
    },
});

// Create a persister
export const persister = createAsyncStoragePersister({
    storage: AsyncStorage,
});
