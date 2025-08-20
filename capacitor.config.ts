import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.booktree.app',
  appName: 'Book Tree',
  webDir: 'www',
  server: {
    cleartext: true,
    androidScheme: 'http',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#ffffffff",
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#A34C04",
      showSpinner: false,
      androidSpinnerStyle: "small",
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
