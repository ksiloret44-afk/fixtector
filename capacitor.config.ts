import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.fixtector.app',
  appName: 'FixTector',
  webDir: 'out',
  server: {
    // En production, l'app se connecte directement au serveur
    // Pour développement local, utilisez: url: 'http://localhost:3001'
    url: process.env.CAPACITOR_SERVER_URL || 'https://weqeep.com',
    cleartext: false, // HTTPS uniquement en production
    androidScheme: 'https', // Utiliser HTTPS pour Android
  },
  android: {
    buildOptions: {
      keystorePath: process.env.ANDROID_KEYSTORE_PATH,
      keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
      keystoreAlias: process.env.ANDROID_KEYSTORE_ALIAS,
      keystoreAliasPassword: process.env.ANDROID_KEYSTORE_ALIAS_PASSWORD,
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#4F46E5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
  },
}

export default config

