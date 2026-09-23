import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ApiError } from '../middleware/errors.js';

const run = promisify(execFile);
export async function validateVideo(filename: string) {
  let output: string;
  try {
    const result = await run(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration:stream=codec_type',
        '-of',
        'json',
        filename,
      ],
      { timeout: 15000, maxBuffer: 1024 * 1024 },
    );
    output = result.stdout;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT')
      throw new ApiError(
        503,
        'VIDEO_PROCESSOR_UNAVAILABLE',
        'Video processing is unavailable. Please try again later.',
      );
    throw new ApiError(
      400,
      'INVALID_VIDEO',
      'This video could not be read. Please export it again as MP4, MOV, or WebM.',
    );
  }
  const metadata = JSON.parse(output);
  const duration = Number(metadata.format?.duration);
  if (
    !metadata.streams?.some((stream: { codec_type: string }) => stream.codec_type === 'video') ||
    !Number.isFinite(duration)
  )
    throw new ApiError(400, 'INVALID_VIDEO', 'The file must contain a playable video');
  if (duration < 60 || duration > 300)
    throw new ApiError(
      400,
      'INVALID_DURATION',
      'Your performance must be between 1 and 5 minutes long',
    );
  return duration;
}
