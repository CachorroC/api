/**
 * @module types/notas
 * @description Case Note Type Definition
 *
 * Defines the structure of annotations, observations, and deadline information
 * associated with a judicial case. Used by NotasBuilder model class to represent
 * case notes with automatic date extraction for due dates.
 *
 * NOTE WORKFLOW:
 * Raw note text input
 *   ↓
 * Parse and extract dates via datesExtractor()
 *   ↓
 * Identify due dates (dates within note context)
 *   ↓
 * Structure into IntNota object
 *   ↓
 * Store as part of carpeta.notas array
 *
 * USAGE:
 * Case workers add notes with embedded dates like:
 * "Seguimiento a embargo: vence el 15/03/2026"
 *   ↓ datesExtractor() finds 15/03/2026
 *   ↓ Sets dueDate property
 *
 * Used in casework dashboards to identify upcoming deadlines
 * and track procedural history without separate date entry.
 */

import { RelevantDate } from '../models/nota';

/**
 * @interface IntNota
 * @description Structure of a judicial case observation/annotation.
 *
 * @property {Date} createdAt - When note was first created/entered
 * @property {string | null} pathname - Location/reference path in case document hierarchy
 * @property {Date | null} dueDate - Extracted deadline date from note text (null if no date found)
 * @property {string} text - Complete original note text
 * @property {string[]} content - Note text split by '//' delimiter for section handling
 */
export interface IntNota {
  createdAt    : Date;
  pathname     : string | null;
  dueDate      : Date | null;
  text         : string;
  content      : string[];
  relevantDates: DateContext[];
}

export type CreateNotaInput = Omit<IntNota, 'createdAt'> & {
  createdAt?: Date
};

export interface DateContext {
  date: Date;
  text: string;
}

// 1. Define the input interfaces (Props)
// Fields with Prisma @default() or @id are marked as optional (?)
export interface RelevantDateProps {
  id?    : string; // DB auto-increments, so it's optional on creation
  date   : Date;
  text   : string;
  notaId?: string | null;
}

export interface NotaProps {
  id?           : string;
  createdAt?    : Date;
  updatedAt?    : Date;
  carpetaNumero?: number | null;
  pathname?     : string | null;
  dueDate?      : Date | null;
  text          : string;
  content       : string[];
  completed?    : boolean;
  relevantDates?: RelevantDateProps[] | RelevantDate[];
}