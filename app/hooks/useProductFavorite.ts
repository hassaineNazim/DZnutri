import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/axios';

const checkFavoriteStatus = async (barcode: string) => {
    const response = await api.get(`/api/favorites_check/${barcode}`);
    return response.data.is_favorite;
};

const toggleFavoriteStatus = async (barcode: string) => {
    const response = await api.post(`/api/favorites/${barcode}`);
    return response.data.is_favorite;
};

export const useProductFavorite = (barcode: string, product?: any) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['favorite', barcode],
        queryFn: () => checkFavoriteStatus(barcode),
        enabled: !!barcode, // Only run if barcode is provided
    });

    const mutation = useMutation({
        mutationFn: () => toggleFavoriteStatus(barcode),
        onMutate: async () => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['favorite', barcode] });
            await queryClient.cancelQueries({ queryKey: ['favorites_list'] });

            // Snapshot previous values
            const previousStatus = queryClient.getQueryData(['favorite', barcode]);
            const previousList = queryClient.getQueryData(['favorites_list']);

            // Optimistically update status
            queryClient.setQueryData(['favorite', barcode], (old: boolean | undefined) => !old);

            // Optimistically update LIST
            if (previousStatus === true) {
                // REMOVE
                queryClient.setQueryData(['favorites_list'], (old: any[] | undefined) => {
                    if (!old) return [];
                    return old.filter((p: any) => p.barcode !== barcode && p.id !== barcode);
                });
            } else {
                // ADD (Only if we have the product object)
                if (product) {
                    queryClient.setQueryData(['favorites_list'], (old: any[] | undefined) => {
                        const newList = old ? [...old] : [];
                        // Check if already exists just in case
                        if (!newList.find((p: any) => p.barcode === barcode)) {
                            newList.push(product);
                        }
                        return newList;
                    });
                }
            }

            // Return context for rollback
            return { previousStatus, previousList };
        },
        onError: (err, newTodo, context: any) => {
            // Rollback both
            if (context?.previousStatus !== undefined) {
                queryClient.setQueryData(['favorite', barcode], context.previousStatus);
            }
            if (context?.previousList !== undefined) {
                queryClient.setQueryData(['favorites_list'], context.previousList);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['favorite', barcode] });
            queryClient.invalidateQueries({ queryKey: ['favorites_list'] });
        },
    });

    return { isFavorite: query.data, isLoading: query.isLoading, toggleFavorite: mutation.mutate };
};
