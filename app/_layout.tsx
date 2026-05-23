import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { AuthScreen } from '@/components/auth-screen';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { JobsProvider } from '@/context/jobs-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    console.log('[RootLayout] mounted');
    return () => {
      console.log('[RootLayout] unmounted');
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function ProtectedApp() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <JobsProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-job" options={{ headerShown: false }} />
        <Stack.Screen name="edit-job/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
    </JobsProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FA',
  },
});
