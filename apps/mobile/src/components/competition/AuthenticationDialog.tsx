import { AuthModal } from '../AuthModal';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';

export function AuthenticationDialog({
  authenticate,
  modal,
  setModal,
}: Pick<LoadedCompetitionState, 'authenticate' | 'modal' | 'setModal'>) {
  return (
    <>
      {modal === 'auth' && (
        <AuthModal onClose={() => setModal(null)} onAuthenticated={authenticate} />
      )}
    </>
  );
}
