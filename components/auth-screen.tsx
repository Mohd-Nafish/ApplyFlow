import { useAuth } from '@/context/auth-context';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type AuthMode = 'sign-in' | 'sign-up';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignIn = mode === 'sign-in';
  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length >= 6 && !isSubmitting,
    [email, isSubmitting, password]
  );

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignIn) {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
      }
    } catch (error) {
      Alert.alert('Authentication failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>ApplyFlow</Text>
          <Text style={styles.subtitle}>Sign in to track your applications.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              secureTextEntry
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={!canSubmit}
            onPress={handleSubmit}
            style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{isSignIn ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => setMode(isSignIn ? 'sign-up' : 'sign-in')}
            style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              {isSignIn ? 'Create an account' : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  keyboardAvoiding: { flex: 1, justifyContent: 'center' },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#6B7280',
  },
  form: {
    paddingHorizontal: 24,
    gap: 14,
  },
  fieldGroup: { gap: 8 },
  label: { fontSize: 14, color: '#374151', fontWeight: '600' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  primaryButton: {
    marginTop: 6,
    minHeight: 50,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: { backgroundColor: '#93C5FD' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryButtonText: { color: '#2563EB', fontSize: 15, fontWeight: '600' },
});
