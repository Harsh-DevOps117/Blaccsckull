import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { colors } from '../lib/theme';
import { Button, Icon, Sheet, Txt, styles } from './ui';

export function UploadModal({
  slug,
  existingTitle,
  onClose,
  onSuccess,
}: {
  slug: string;
  existingTitle?: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [title, setTitle] = useState(existingTitle ?? '');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const choose = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/webm', 'video/quicktime'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        if ((result.assets[0].size ?? 0) > 50 * 1024 * 1024) {
          setError('Please choose a video smaller than 50 MB.');
          return;
        }
        setFile(result.assets[0]);
        setError('');
      }
    } catch {
      setError('Unable to open the file picker. Please try again.');
    }
  };
  const submit = async () => {
    if (!file || title.trim().length < 3) {
      setError('Add a performance title and choose your video.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('title', title.trim());
      if (Platform.OS === 'web') {
        const blob = file.file ?? (await (await fetch(file.uri)).blob());
        form.append('video', blob, file.name);
      } else form.append('video', new File(file.uri), file.name);
      await api(`/competitions/${slug}/submission`, {
        method: 'POST',
        body: form,
      });
      await onSuccess();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      title={existingTitle ? 'Update your performance' : 'Your moment to shine'}
      onClose={busy ? () => {} : onClose}
    >
      <Txt muted>
        Upload your original solo performance. You can replace it any time before the submission
        deadline.
      </Txt>
      <TextInput
        accessibilityLabel="Performance title"
        placeholder="Performance title"
        value={title}
        onChangeText={setTitle}
        maxLength={120}
        style={styles.input}
      />
      <View
        style={{
          alignItems: 'center',
          padding: 24,
          backgroundColor: colors.pale,
          borderRadius: 12,
          gap: 10,
        }}
      >
        <Icon name="cloud-upload-outline" size={38} />
        <Txt bold>{file?.name ?? 'Choose your dance video'}</Txt>
        <Txt muted>MP4, MOV, or WebM · Up to 50 MB</Txt>
        <Button
          title={file ? 'Choose another video' : 'Choose video'}
          onPress={choose}
          secondary
          disabled={busy}
        />
      </View>
      {!!error && (
        <View accessibilityRole="alert" style={styles.error}>
          <Txt style={{ color: colors.red }}>{error}</Txt>
        </View>
      )}
      <Button title={busy ? 'Uploading…' : 'Submit performance'} onPress={submit} busy={busy} />
    </Sheet>
  );
}
