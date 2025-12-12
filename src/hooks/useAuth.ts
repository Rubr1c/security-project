import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/db/types';
import { getRoleRoute } from '@/lib/routes';
import type { LoginResponse, RegisterResponse } from '@/services/api/auth';

interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  doctorId: number | null;
}

export const useAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setUser, logout, user, isAuthenticated } = useAuthStore();

  const completeLogin = async () => {
    try {
      const userData = (await api.auth.me()) as UserResponse;
      setUser(userData);
      router.push(getRoleRoute(userData.role));
    } catch {
      router.push('/dashboard');
    }
  };

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: async (data) => {
      const res = data as LoginResponse;
      if ('otpRequired' in res && res.otpRequired) {
        router.push(`/otp?email=${encodeURIComponent(res.email)}`);
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: api.auth.register,
    onSuccess: (data) => {
      const res = data as RegisterResponse;
      if ('otpRequired' in res && res.otpRequired) {
        router.push(`/otp?email=${encodeURIComponent(res.email)}`);
        return;
      }
      router.push('/login');
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: api.auth.verifyOtp,
    onSuccess: async () => {
      await completeLogin();
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: api.auth.resendOtp,
  });

  const changePasswordRequestMutation = useMutation({
    mutationFn: api.auth.changePasswordRequest,
  });

  const changePasswordVerifyMutation = useMutation({
    mutationFn: api.auth.changePasswordVerify,
  });

  const userQuery = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await api.auth.me();
      return response as UserResponse;
    },
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Continue with local logout even if API fails
    }
    logout();
    queryClient.clear();
    router.push('/login');
  };

  return {
    loginMutation,
    registerMutation,
    verifyOtpMutation,
    resendOtpMutation,
    changePasswordRequestMutation,
    changePasswordVerifyMutation,
    userQuery,
    user,
    setUser,
    logout: handleLogout,
    isAuthenticated,
  };
};
