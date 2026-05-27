import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gdoc',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  daviteApiUrl: process.env.DAVITE_API_URL || 'http://172.16.32.99:3001',
};
