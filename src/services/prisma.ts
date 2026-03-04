/**
 * @module services/prisma
 * @description Prisma ORM Client Initialization and Singleton
 * 
 * Initializes the Prisma Client with PostgreSQL adapter (PrismaPg) for type-safe
 * database access throughout the application. Acts as the single connection point
 * for all database operations.
 * 
 * INITIALIZATION FLOW:
 * 1. Load environment variables from .env file via dotenv.config()
 * 2. Retrieve DATABASE_URL from process.env
 * 3. Validate DATABASE_URL existence (throw if missing)
 * 4. Create PrismaPg adapter with PostgreSQL connection string
 * 5. Instantiate PrismaClient with adapter
 * 6. Export client as singleton for module-level import
 * 
 * ADAPTER CONFIGURATION:
 * Uses @prisma/adapter-pg (PostgreSQL adapter) instead of default Node.js driver.
 * This adapter provides:
 * - Connection pooling
 * - Better handling of large datasets
 * - Support for prepared statements
 * - Optimized for PostgreSQL-specific features
 * 
 * USAGE PATTERN:
 * All modules import client as: import { client } from './services/prisma.js'
 * Then use: client.carpeta.findMany(), client.actuacion.create(), etc.
 * 
 * ERROR HANDLING:
 * Throws at startup if DATABASE_URL not defined (fail-fast design).
 * Prevents silent failures and connection issues at runtime.
 * 
 * ENVIRONMENT SETUP:
 * Requires .env file with:
 * DATABASE_URL=postgresql://user:password@localhost:5432/rsasesorjuridico
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../prisma/generated/prisma/client.js';

import dotenv from 'dotenv';
dotenv.config();

/**
 * @constant {string} connectionString
 * @description PostgreSQL connection string from DATABASE_URL environment variable.
 * Format: postgresql://[user]:[password]@[host]:[port]/[database]
 * @throws {Error} If DATABASE_URL not defined in .env
 */
const connectionString = process.env.DATABASE_URL;

if ( !connectionString ) {
  throw new Error(
    'DATABASE_URL no está definida en el archivo .env' 
  );
}

/**
 * @constant {PrismaPg} adapter
 * @description PostgreSQL adapter for Prisma ORM.
 * Provides connection pooling and optimized database access for PostgreSQL.
 */
const adapter = new PrismaPg(
  {
    connectionString,
  } 
);

/**
 * @constant {PrismaClient} client
 * @description Singleton Prisma Client instance for all database operations.
 * Configured with PostgreSQL adapter for type-safe access to schema types.
 * 
 * USAGE:
 * import { client } from './services/prisma.js'
 * const carpeta = await client.carpeta.findUnique({where: {numero: 123}});
 * 
 * @type {PrismaClient}
 */
export const client = new PrismaClient(
  {
    adapter,
  } 
);
