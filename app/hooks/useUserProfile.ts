import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/axios';

const fetchProfile = async () => {
    const response = await api.get('/profile');
    return response.data;
};

const updateProfile = async (data: any) => {
    const response = await api.put('/profile', data);
    return response.data;
};

export const useUserProfile = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['userProfile'],
        queryFn: fetchProfile,
    });

    const mutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (newData) => {
            // Invalidate and refetch, or update manually
            // Here we update manually for instant feedback + keeping the detailed return values (calories/proteins)
            queryClient.setQueryData(['userProfile'], (oldData: any) => ({
                ...oldData,
                ...newData,
            }));
        },
    });

    return { ...query, updateProfile: mutation.mutateAsync, isUpdating: mutation.isPending };
};
