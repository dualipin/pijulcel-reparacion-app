import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.pijulcel.com',
  appName: 'Pijulcel',
  webDir: 'www',
  server: {
    cleartext: true,   // <--- importante
    androidScheme: "http" // fuerza http
  },
  plugins: {
    SafeArea: {
      enabled: true,
      customColorsForSystemBars: true,
      statusBarColor: '#00000000',
      statusBarContent: 'light',
      navigationBarColor: '#00000000',
      navigationBarContent: 'dark',
      offset: 0,
      showBottomSpacing: false  // 👈 OCULTA el safe area inferior
    }
  }
};

export default config;
