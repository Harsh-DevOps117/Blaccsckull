import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateVideo } from '../src/services/video.js';

let directory: string;
beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'feedants-video-test-'));
  await promisify(execFile)('ffmpeg', [
    '-v',
    'error',
    '-i',
    '../../docs/demo-performance.mp4',
    '-t',
    '1',
    '-c',
    'copy',
    path.join(directory, 'short.mp4'),
  ]);
  await writeFile(
    path.join(directory, 'broken.mp4'),
    Buffer.from('00000018667479706d703432000000006d70343269736f6d', 'hex'),
  );
});
afterAll(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});
describe('video metadata validation', () => {
  it('accepts a playable 65-second performance', async () => {
    expect(await validateVideo('../../docs/demo-performance.mp4')).toBe(65);
  });
  it('rejects playable videos shorter than one minute', async () => {
    await expect(validateVideo(path.join(directory, 'short.mp4'))).rejects.toMatchObject({
      code: 'INVALID_DURATION',
    });
  });
  it('rejects a truncated video with a valid MP4 signature', async () => {
    await expect(validateVideo(path.join(directory, 'broken.mp4'))).rejects.toMatchObject({
      code: 'INVALID_VIDEO',
    });
  });
});
