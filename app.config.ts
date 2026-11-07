import { ExpoConfig, ConfigContext } from 'expo/config';
export default ({ config }: ConfigContext): ExpoConfig => {
  // `eas init` writes the real account-owned project ID into app.json.
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || config.extra?.eas?.projectId;
  return {
    ...config,
    plugins: [['expo-splash-screen', {backgroundColor:'#0d0d0d'}], ...(config.plugins||[]).filter(p=>(typeof p==='string'?p:p[0])!=='expo-splash-screen'), ...['expo-font','expo-sharing','expo-video'].filter(name=>!(config.plugins||[]).some(p=>(typeof p==='string'?p:p[0])===name))],
    name: 'GoLuxe', slug: 'goluxe', version: '1.0.0', scheme: 'goluxe',
    userInterfaceStyle: 'automatic', orientation: 'portrait',
    ...(projectId ? {
      extra: { ...config.extra, eas: { projectId } },
      runtimeVersion: { policy: 'fingerprint' },
      updates: { url: `https://u.expo.dev/${projectId}`, checkAutomatically: 'NEVER' },
    } : { updates: { enabled: false } }),
  };
};
