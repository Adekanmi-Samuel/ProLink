import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'prolink_auth_token';
const USER_KEY = 'prolink_user_data';

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

export const userStorage = {
  async getUser<T>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setUser<T>(user: T): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  async removeUser(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
