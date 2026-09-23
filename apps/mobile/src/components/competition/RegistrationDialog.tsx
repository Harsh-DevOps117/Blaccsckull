import { View } from 'react-native';
import { colors, money } from '../../lib/theme';
import { Button, Icon, Sheet, Txt, styles as ui } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';
import { screenStyles as s } from './screenStyles';

export function RegistrationDialog({
  data,
  locale,
  modal,
  setModal,
  busy,
  actionError,
  c,
  register,
}: Pick<
  LoadedCompetitionState,
  'data' | 'locale' | 'modal' | 'setModal' | 'busy' | 'actionError' | 'c' | 'register'
>) {
  return (
    <>
      {modal === 'register' && (
        <Sheet title="Take your spot on the stage" onClose={busy ? () => {} : () => setModal(null)}>
          <Txt bold style={{ fontSize: 20 }}>
            {c.title[locale]}
          </Txt>
          <View style={s.summary}>
            <Txt>Entry fee</Txt>
            <Txt bold style={{ color: colors.teal, fontSize: 25 }}>
              {money(c.entryFee)}
            </Txt>
          </View>
          <Txt muted>
            {c.spotsLeft} spots remaining. Your registration is confirmed only after a spot is
            successfully reserved.
          </Txt>
          <View style={s.demoNote}>
            <Icon name="flask-outline" />
            <Txt style={{ flex: 1 }}>
              {c.entryFee === 0
                ? 'This competition is free to enter.'
                : 'Simulated payment only. No real money will be charged.'}
            </Txt>
          </View>
          <Txt muted style={{ fontSize: 13 }}>
            By registering you agree to the competition rules and refund policy.
          </Txt>
          {!!actionError && (
            <View style={ui.error}>
              <Txt style={{ color: colors.red }}>{actionError}</Txt>
            </View>
          )}
          <Button
            title={
              c.entryFee === 0
                ? 'Confirm free registration'
                : data.paymentMode === 'demo'
                  ? `Confirm simulated payment · ${money(c.entryFee)}`
                  : 'Payments are unavailable'
            }
            onPress={register}
            busy={busy}
            disabled={data.paymentMode === 'disabled' && c.entryFee > 0}
          />
        </Sheet>
      )}
    </>
  );
}
