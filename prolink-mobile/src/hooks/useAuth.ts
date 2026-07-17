import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { user, token, isLoading, isAuthenticated, login, register, logout, fetchUser, setToken } =
    useAuthStore();

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    isClient: user?.user_type === 'client',
    isProvider: user?.user_type === 'provider',
    isAdmin: user?.user_type === 'admin',
    login,
    register,
    logout,
    fetchUser,
    setToken,
  };
}

export default useAuth;
