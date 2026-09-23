import { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { colors } from '../lib/theme';
import type { User } from '../lib/types';
import { Button, Sheet, Txt, styles } from './ui';

export function AuthModal({
  onClose,
  onAuthenticated,
}: {
  onClose: () => void;
  onAuthenticated: (token: string, user: User) => Promise<void>;
}) {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = Platform.OS === 'web' ? new URLSearchParams(window.location.search).get('ref') : null;

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api<{ token: string; user: User }>(
        `/auth/${signup ? 'signup' : 'login'}`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
            ...(signup ? { name, ...(ref ? { referralCode: ref } : {}) } : {}),
          }),
        },
      );
      await onAuthenticated(result.token, result.user);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title={signup ? 'Join the Feedants community' : 'Welcome back'} onClose={onClose}>
      <Txt muted>
        {signup
          ? 'Create an account to take your talent to the stage.'
          : 'Sign in to register, upload your performance, and follow your competition.'}
      </Txt>
      {signup && (
        <TextInput
          accessibilityLabel="Full name"
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          autoComplete="name"
        />
      )}
      <TextInput
        accessibilityLabel="Email address"
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <View style={{ position: 'relative', justifyContent: 'center', zIndex: 1 }}>
        <TextInput
          accessibilityLabel="Password"
          placeholder="Password (at least 10 characters)"
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { paddingRight: 50 }]}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={signup ? 'new-password' : 'current-password'}
          onSubmitEditing={submit}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          onPress={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: 12,
            padding: 8,
            zIndex: 2,
            elevation: 2,
          }}
        >
          <Txt style={{ color: colors.teal, fontSize: 13, fontWeight: 'bold' }}>
            {showPassword ? 'Hide' : 'Show'}
          </Txt>
        </Pressable>
      </View>
      {!!error && (
        <View accessibilityRole="alert" style={styles.error}>
          <Txt style={{ color: colors.red }}>{error}</Txt>
        </View>
      )}
      <Button title={signup ? 'Create account' : 'Sign in'} onPress={submit} busy={busy} />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setSignup(!signup);
          setError('');
        }}
      >
        <Txt style={{ color: colors.teal, textAlign: 'center' }}>
          {signup ? 'Already have an account? Sign in' : 'New to Feedants? Create an account'}
        </Txt>
      </Pressable>
    </Sheet>
  );
}
