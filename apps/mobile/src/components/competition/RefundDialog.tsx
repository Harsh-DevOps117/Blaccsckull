import { Icon, Sheet, Txt } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';

export function RefundDialog({
  locale,
  modal,
  setModal,
  t,
  c,
}: Pick<LoadedCompetitionState, 'locale' | 'modal' | 'setModal' | 't' | 'c'>) {
  return (
    <>
      {modal === 'refund' && (
        <Sheet title={t('refund')} onClose={() => setModal(null)}>
          <Icon name="shield-checkmark-outline" size={42} />
          <Txt>{c.refundPolicy[locale]}</Txt>
        </Sheet>
      )}
    </>
  );
}
