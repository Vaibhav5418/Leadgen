require('dotenv').config();

const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL ERROR: Environment variable ${envVar} is missing.`);
    process.exit(1);
  }
}

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  MONGODB_URI: process.env.MONGODB_URI,
  PORT: process.env.PORT || 5000,
  FRONTEND_URL: process.env.FRONTEND_URL,
  SERVER_URL: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`,
};
