import { View } from 'react-native';
import { Card, Icon, Sheet, Txt, styles as ui } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';

export function TestimonialsDialog({
  locale,
  modal,
  setModal,
  t,
  c,
}: Pick<LoadedCompetitionState, 'locale' | 'modal' | 'setModal' | 't' | 'c'>) {
  return (
    <>
      {modal === 'testimonials' && (
        <Sheet title={t('hear')} onClose={() => setModal(null)}>
          {c.testimonials.map((item) => (
            <Card key={item.name} style={{ gap: 10 }}>
              <View style={ui.row}>
                {Array.from({ length: item.rating }, (_, i) => (
                  <Icon key={i} name="star" color="#E6AB2D" size={18} />
                ))}
              </View>
              <Txt>“{item.quote[locale]}”</Txt>
              <Txt bold>{item.name}</Txt>
            </Card>
          ))}
        </Sheet>
      )}
    </>
  );
}
