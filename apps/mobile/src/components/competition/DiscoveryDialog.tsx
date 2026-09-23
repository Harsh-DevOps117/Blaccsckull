import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { api } from '../../lib/api';
import { colors, money } from '../../lib/theme';
import type { Competition } from '../../lib/types';
import { Button, Card, Icon, Sheet, Txt, styles as ui } from '../ui';

import type { LoadedCompetitionState } from '../../hooks/useCompetitionScreen';

export function DiscoveryDialog({
  setSlug,
  locale,
  modal,
  setModal,
  competitions,
  setCompetitions,
  search,
  setSearch,
  listError,
  setListError,
  listLoading,
  setListLoading,
  scroller,
  show,
}: Pick<
  LoadedCompetitionState,
  | 'setSlug'
  | 'locale'
  | 'modal'
  | 'setModal'
  | 'competitions'
  | 'setCompetitions'
  | 'search'
  | 'setSearch'
  | 'listError'
  | 'setListError'
  | 'listLoading'
  | 'setListLoading'
  | 'scroller'
  | 'show'
>) {
  return (
    <>
      {(modal === 'browse' || modal === 'home') && (
        <Sheet
          title={modal === 'home' ? 'Welcome to Feedants' : 'Explore competitions'}
          onClose={() => setModal(null)}
        >
          <Txt muted>
            {modal === 'home'
              ? 'Your stage awaits. Discover the latest competitions below.'
              : 'Search by competition name or category.'}
          </Txt>
          {modal === 'home' ? (
            <Button
              title="Explore all competitions"
              onPress={() => {
                setSearch('');
                show('browse');
              }}
            />
          ) : (
            <TextInput
              accessibilityLabel="Search competitions"
              placeholder="Search competitions"
              value={search}
              onChangeText={setSearch}
              style={ui.input}
            />
          )}
          {!!listError && (
            <Button
              title="Retry"
              onPress={() => {
                setListLoading(true);
                setListError('');
                void api<{ competitions: Competition[] }>('/competitions')
                  .then((r) => setCompetitions(r.competitions))
                  .catch((e) => setListError(e.message))
                  .finally(() => setListLoading(false));
              }}
            />
          )}
          {modal === 'browse' &&
            !listLoading &&
            !listError &&
            competitions.length > 0 &&
            !competitions.some((item) =>
              `${item.title[locale]} ${item.category[locale]}`
                .toLowerCase()
                .includes(search.trim().toLowerCase()),
            ) && <Txt>No matching competitions. Try another search.</Txt>}
          {listLoading && <ActivityIndicator color={colors.teal} />}
          {!!listError && <Txt style={{ color: colors.red }}>{listError}</Txt>}
          {!listLoading && !listError && competitions.length === 0 && (
            <Txt>No competitions are available right now.</Txt>
          )}
          {competitions
            .filter(
              (item) =>
                modal === 'home' ||
                `${item.title[locale]} ${item.category[locale]}`
                  .toLowerCase()
                  .includes(search.trim().toLowerCase()),
            )
            .map((item) => (
              <Pressable
                accessibilityRole="button"
                key={item._id}
                onPress={() => {
                  setSlug(item.slug);
                  setModal(null);
                  scroller.current?.scrollTo({ y: 0 });
                }}
              >
                <Card style={{ gap: 8 }}>
                  <View style={ui.row}>
                    <Icon name="musical-notes-outline" size={29} />
                    <Txt bold style={{ flex: 1, fontSize: 20 }}>
                      {item.title[locale]}
                    </Txt>
                    <Icon name="chevron-forward" />
                  </View>
                  <Txt muted>
                    {item.category[locale]} · {item.capacity - item.booked} spots left ·{' '}
                    {money(item.entryFee)}
                  </Txt>
                  <Txt style={{ color: colors.teal }}>{item.lifecycle.replaceAll('_', ' ')}</Txt>
                </Card>
              </Pressable>
            ))}
        </Sheet>
      )}
    </>
  );
}
