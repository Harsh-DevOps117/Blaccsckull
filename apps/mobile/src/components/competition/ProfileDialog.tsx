import { View } from 'react-native';
import { colors } from '../../lib/theme';
import { Button, Card, Sheet, Txt, styles as ui } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';
import { screenStyles as s } from './screenStyles';

export function ProfileDialog({
  data,
  user,
  signOut,
  locale,
  modal,
  setModal,
  setVideo,
  referral,
  t,
  c,
}: Pick<
  LoadedCompetitionState,
  | 'data'
  | 'user'
  | 'signOut'
  | 'locale'
  | 'modal'
  | 'setModal'
  | 'setVideo'
  | 'referral'
  | 't'
  | 'c'
>) {
  return (
    <>
      {modal === 'profile' && user && (
        <Sheet title={t('profile')} onClose={() => setModal(null)}>
          <View style={ui.row}>
            <View style={s.avatar}>
              <Txt bold style={{ fontSize: 27, color: colors.teal }}>
                {user.name[0]}
              </Txt>
            </View>
            <View>
              <Txt bold style={{ fontSize: 21 }}>
                {user.name}
              </Txt>
              <Txt muted>{user.email}</Txt>
            </View>
          </View>
          <Card>
            <Txt bold>{c.title[locale]}</Txt>
            <Txt muted>
              {data.participation
                ? t(data.participation.status === 'submitted' ? 'submitted' : 'registered')
                : 'You haven’t registered yet'}
            </Txt>
            {data.participation?.submission && (
              <>
                <Txt style={{ marginTop: 12 }}>{data.participation.submission.title}</Txt>
                <Button
                  title="View my submission"
                  secondary
                  style={{ marginTop: 12 }}
                  onPress={() => {
                    setModal(null);
                    setVideo({
                      title: data.participation!.submission!.title,
                      url: data.participation!.submission!.videoUrl,
                      privateVideo: true,
                    });
                  }}
                />
              </>
            )}
          </Card>
          <Txt muted>
            {referral?.referralCount ?? 0} referred signups · Referral rewards are demo credits.
          </Txt>
          <Button
            title={t('signOut')}
            secondary
            onPress={async () => {
              await signOut();
              setModal(null);
            }}
          />
        </Sheet>
      )}
    </>
  );
}
