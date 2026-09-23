import { View } from 'react-native';
import { colors, money } from '../../lib/theme';
import { Button, Icon, Sheet, Txt } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';

export function PaymentConfirmationDialog({
  locale,
  modal,
  setModal,
  c,
}: Pick<LoadedCompetitionState, 'locale' | 'modal' | 'setModal' | 'c'>) {
  return (
    <>
      {modal === 'paymentSuccess' && (
        <Sheet
          title={c.entryFee ? 'Payment confirmed' : 'Registration confirmed'}
          onClose={() => setModal(null)}
        >
          <View
            accessibilityRole="alert"
            style={{ alignItems: 'center', gap: 14, paddingVertical: 20 }}
          >
            <Icon name="checkmark-circle" size={86} color={colors.teal} />
            <Txt bold style={{ fontSize: 24 }}>
              You’re registered!
            </Txt>
            <Txt>{c.title[locale]}</Txt>
            <Txt bold style={{ color: colors.teal, fontSize: 26 }}>
              {money(c.entryFee)}
            </Txt>
            <Txt muted>
              {c.entryFee
                ? 'Simulated payment successful. No real money was charged.'
                : 'Your free registration is confirmed.'}
            </Txt>
          </View>
          <Button title="Done" onPress={() => setModal(null)} />
        </Sheet>
      )}
    </>
  );
}
