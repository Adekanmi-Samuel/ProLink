import Constants from 'expo-constants';

const ENV = {
  API_BASE_URL:
    Constants.expoConfig?.extra?.apiBaseURL ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    'https://prolink-backend.vercel.app/api',
  SOCKET_URL:
    Constants.expoConfig?.extra?.socketURL ||
    process.env.EXPO_PUBLIC_SOCKET_URL ||
    'https://prolink-backend.vercel.app',
};

export default ENV;
