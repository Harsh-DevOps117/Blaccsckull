import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { Competition } from '../models/index.js';

try {
  await connectDatabase();
  const result = await Competition.updateOne(
    { slug: 'feedants-classical-dance' },
    {
      $set: {
        'judge.videoUrl': '/media/demo-performance.mp4',
        'winners.$[].videoUrl': '/media/demo-performance.mp4',
        payoutVideoUrl: '/media/demo-performance.mp4',
      },
    },
  );
  console.log(`Demo video configured for ${result.matchedCount} competition.`);
} catch (error) {
  console.error('Unable to update preview video:', (error as Error).name);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
