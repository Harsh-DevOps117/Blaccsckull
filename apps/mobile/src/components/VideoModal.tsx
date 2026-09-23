import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Sheet, Txt } from './ui';
import { getToken } from '../lib/api';
import { colors } from '../lib/theme';

export function VideoModal({
  title,
  url,
  privateVideo,
  onClose,
}: {
  title: string;
  url: string;
  privateVideo?: boolean;
  onClose: () => void;
}) {
  const needsBlob = privateVideo && Platform.OS === 'web';
  const [source, setSource] = useState(needsBlob ? '' : url);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!needsBlob) return;
    const controller = new AbortController();
    let objectUrl = '';
    (async () => {
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${getToken()}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Unable to load your submission. Please sign in again.');
        const blob = await response.blob();
        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setSource(objectUrl);
        }
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      }
    })();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [needsBlob, url]);
  return (
    <Sheet title={title} onClose={onClose}>
      {error ? (
        <Txt style={{ color: colors.red }}>{error}</Txt>
      ) : source ? (
        <Player url={source} authenticated={!!privateVideo && Platform.OS !== 'web'} />
      ) : (
        <ActivityIndicator color={colors.teal} />
      )}
    </Sheet>
  );
}

function Player({ url, authenticated }: { url: string; authenticated: boolean }) {
  const player = useVideoPlayer(
    { uri: url, headers: authenticated ? { Authorization: `Bearer ${getToken()}` } : undefined },
    (p) => {
      p.play();
    },
  );
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  return (
    <View style={{ gap: 12 }}>
      <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#101526' }}>
        <VideoView
          player={player}
          style={{ width: '100%', height: 260 }}
          nativeControls
          fullscreenOptions={{ enable: true }}
          contentFit="contain"
        />
      </View>
      {status === 'loading' && <ActivityIndicator color={colors.teal} />}
      {status === 'error' && (
        <Txt style={{ color: colors.red }}>
          This video is unavailable. Please check your connection and try again.
        </Txt>
      )}
    </View>
  );
}
