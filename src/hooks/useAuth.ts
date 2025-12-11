import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/db/types';

interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  doctorId: number | null;
}

const roleRouteMap: Record<UserRole, string> = {
  patient: '/dashboard/patient',
  doctor: '/dashboard/doctor',
  admin: '/dashboard/admin',
  nurse: '/dashboard/nurse',
};

export const useAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { login, setUser, logout, token, user } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: async (data) => {
      login(data.token);
      try {
        const userData = (await api.auth.me()) as UserResponse;
        setUser(userData);
        router.push(roleRouteMap[userData.role]);
      } catch {
        router.push('/dashboard');
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: api.auth.register,
    onSuccess: () => {
      router.push('/login');
    },
  });

  const userQuery = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await api.auth.me();
      return response as UserResponse;
    },
    enabled: !!token,
  });

  const handleLogout = () => {
    logout();
    queryClient.clear();
    router.push('/login');
  };

  return {
    loginMutation,
    registerMutation,
    userQuery,
    user,
    setUser,
    logout: handleLogout,
    isAuthenticated: !!token,
  };
};
