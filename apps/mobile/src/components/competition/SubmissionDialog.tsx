import { UploadModal } from '../UploadModal';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';

export function SubmissionDialog({
  data,
  refresh,
  modal,
  setModal,
  setToast,
  c,
}: Pick<LoadedCompetitionState, 'data' | 'refresh' | 'modal' | 'setModal' | 'setToast' | 'c'>) {
  return (
    <>
      {modal === 'upload' && (
        <UploadModal
          slug={c.slug}
          existingTitle={data.participation?.submission?.title}
          onClose={() => setModal(null)}
          onSuccess={async () => {
            await refresh();
            setToast('Your performance was submitted successfully.');
          }}
        />
      )}
    </>
  );
}
