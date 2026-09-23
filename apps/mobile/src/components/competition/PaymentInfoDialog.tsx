import { Sheet, Txt } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';

export function PaymentInfoDialog({
  modal,
  setModal,
}: Pick<LoadedCompetitionState, 'modal' | 'setModal'>) {
  return (
    <>
      {modal === 'payments' && (
        <Sheet title="Payment information" onClose={() => setModal(null)}>
          <Txt>
            Payments are simulated. No real money is charged. Your spot is reserved only after the
            server confirms your registration.
          </Txt>
        </Sheet>
      )}
    </>
  );
}
