import { VideoModal } from '../VideoModal';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';

export function CompetitionVideoDialog({
  video,
  setVideo,
}: Pick<LoadedCompetitionState, 'video' | 'setVideo'>) {
  return <>{video && <VideoModal {...video} onClose={() => setVideo(null)} />}</>;
}
