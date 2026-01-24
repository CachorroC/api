import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/prisma/client.js';

const connectionString
  = 'postgresql://postgres:Tengo1amo@192.168.1.101:5432/RyS?schema=public';

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
