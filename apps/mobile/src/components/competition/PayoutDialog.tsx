import { Button, Icon, Sheet, Txt } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';

export function PayoutDialog({
  locale,
  modal,
  setModal,
  t,
  c,
  onVideo,
}: Pick<LoadedCompetitionState, 'locale' | 'modal' | 'setModal' | 't' | 'c' | 'onVideo'>) {
  return (
    <>
      {modal === 'payout' && (
        <Sheet title={t('prizeQuestion').replace('\n', ' ')} onClose={() => setModal(null)}>
          <Icon name="trophy-outline" size={42} />
          <Txt>{c.payoutInfo[locale]}</Txt>
          <Button
            title={t('watch')}
            onPress={() => {
              setModal(null);
              onVideo('Prize money explained', c.payoutVideoUrl);
            }}
          />
        </Sheet>
      )}
    </>
  );
}
