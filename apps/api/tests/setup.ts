process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test';
process.env.MONGODB_DB = 'feedants_isolated_test';
process.env.JWT_SECRET = 'isolated-test-secret-never-used-in-production';
process.env.PAYMENT_MODE = 'demo';
process.env.MONGOMS_DOWNLOAD_DIR = '/tmp/feedants-mongodb';
process.env.MONGOMS_DISTRO = 'ubuntu-22.04';

process.env.RAZORPAY_KEY_ID = '';
process.env.RAZORPAY_KEY_SECRET = '';
process.env.RAZORPAY_WEBHOOK_SECRET = '';
