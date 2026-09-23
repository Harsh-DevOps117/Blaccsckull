import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { translate } from '../../lib/i18n';
import { colors } from '../../lib/theme';
import type { Competition, Locale } from '../../lib/types';
import { Card, Icon, Txt, styles as ui } from '../ui';

import { sectionStyles as s } from './sectionStyles';
export function InformationCard({
  c,
  locale,
  compact,
}: {
  c: Competition;
  locale: Locale;
  compact: boolean;
}) {
  const [tab, setTab] = useState<'about' | 'criteria' | 'rules'>('about');
  const [expanded, setExpanded] = useState(false);
  return (
    <Card style={{ padding: compact ? 14 : 22, paddingTop: 8, paddingBottom: 10 }}>
      <View
        style={{
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderColor: '#E0E5EF',
          marginBottom: 14,
        }}
      >
        {(['about', 'criteria', 'rules'] as const).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === item }}
            onPress={() => setTab(item)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderBottomWidth: 3,
              borderColor: tab === item ? colors.teal : 'transparent',
              paddingVertical: 13,
            }}
          >
            <Txt
              bold
              style={{
                color: tab === item ? colors.teal : colors.muted,
                fontSize: compact ? 11 : 16,
                textAlign: 'center',
              }}
            >
              {translate(item, locale)}
            </Txt>
          </Pressable>
        ))}
      </View>
      {tab === 'about' && (
        <>
          <Txt muted style={{ fontSize: compact ? 14 : 17, lineHeight: 25 }}>
            {c.about[locale]}
          </Txt>
          {expanded && (
            <Txt muted style={{ marginTop: 10, lineHeight: 25 }}>
              {c.aboutMore[locale]}
            </Txt>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => setExpanded(!expanded)}
            style={[ui.row, { justifyContent: 'center', paddingTop: 6 }]}
          >
            <Txt style={{ color: colors.teal }}>
              {translate(expanded ? 'less' : 'more', locale)}
            </Txt>
            <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} />
          </Pressable>
        </>
      )}
      {tab === 'criteria' && (
        <View style={{ gap: 12, paddingBottom: 8 }}>
          {c.criteria.map((v) => (
            <View key={v.label.en} style={{ gap: 5 }}>
              <View style={[ui.row, { justifyContent: 'space-between' }]}>
                <Txt>{v.label[locale]}</Txt>
                <Txt bold style={{ color: colors.teal }}>
                  {v.weight}%
                </Txt>
              </View>
              <View style={s.progress}>
                <View style={{ width: `${v.weight}%`, height: 5, backgroundColor: colors.teal }} />
              </View>
            </View>
          ))}
        </View>
      )}
      {tab === 'rules' && (
        <View style={{ gap: 12, paddingBottom: 10 }}>
          {c.rules.map((rule, i) => (
            <View key={i} style={[ui.row, { alignItems: 'flex-start' }]}>
              <Icon name="checkmark-circle-outline" size={19} />
              <Txt muted style={{ flex: 1 }}>
                {rule[locale]}
              </Txt>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
