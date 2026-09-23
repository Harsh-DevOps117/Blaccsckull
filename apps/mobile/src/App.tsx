import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './lib/theme';
import { CompetitionScreen } from './screens/CompetitionScreen';

export default function App() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {!loaded && !error ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator color={colors.teal} />
        </View>
      ) : (
        <CompetitionScreen />
      )}
    </SafeAreaProvider>
  );
}
