import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/prisma/client.js';

import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if ( !connectionString ) {
  throw new Error(
    'DATABASE_URL no está definida en el archivo .env' 
  );
}

const adapter = new PrismaPg(
  {
    connectionString,
  } 
);

export const client = new PrismaClient(
  {
    adapter,
  } 
);
