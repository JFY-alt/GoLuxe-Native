import { ExpoConfig, ConfigContext } from 'expo/config';
export default ({ config }: ConfigContext): ExpoConfig => {
  // `eas init` writes the real account-owned project ID into app.json.
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || config.extra?.eas?.projectId;
  return {
    ...config,
    name: 'GoLuxe', slug: 'goluxe', version: '1.0.0', scheme: 'goluxe',
    userInterfaceStyle: 'automatic', orientation: 'portrait',
    ...(projectId ? {
      extra: { ...config.extra, eas: { projectId } },
      runtimeVersion: { policy: 'fingerprint' },
      updates: { url: `https://u.expo.dev/${projectId}`, checkAutomatically: 'NEVER' },
    } : { updates: { enabled: false } }),
  };
};
