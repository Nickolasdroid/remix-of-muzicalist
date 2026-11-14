import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.muzicalist.app',
  appName: 'Muzicalist',
  webDir: 'dist',
  // Dark app: the area behind the system bars matches the page, and their icons stay light
  backgroundColor: '#121212',
  plugins: {
    SystemBars: {
      // The page sits inside the status bar / navigation bar, never under them
      insetsHandling: 'native',
      initialViewportFitValueHint: 'auto',
      style: 'DARK',
    },
  },
};

export default config;
