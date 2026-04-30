import { Platform } from 'react-native';
import Constants from 'expo-constants';

const FALLBACK_LAN_IP = '192.16.26.113';
const HOSTED_API_URL = 'http://72.62.255.113:5001';
const USE_HOSTED_API = true;

const getExpoHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    '';

  if (!hostUri) return '';
  return hostUri.split(':')[0];
};

const getDevApiUrl = () => {
  if (USE_HOSTED_API) {
    return HOSTED_API_URL;
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }

  const expoHost = getExpoHost();

  if (expoHost && expoHost !== '127.0.0.1' && expoHost !== 'localhost') {
    return `http://${expoHost}:5000`;
  }

  return `http://${FALLBACK_LAN_IP}:5000`;
};

export const API_URL = getDevApiUrl();
export const API_BASE = `${API_URL}/api`;
