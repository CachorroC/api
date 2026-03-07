/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview FileLogger - JSON-based Audit and Error Tracking
 *
 * This module provides persistent logging for the synchronization process.
 * It writes audit records to JSON files for:
 * - Failed operations during sync (DB inserts, API calls, webhooks)
 * - New legal actions discovered
 * - Progress tracking and debugging
 *
 * Files:
 * - logs/{filename}: Error/failure logs (specified at construction)
 * - logs/new_actuaciones_accumulator.json: New actions found (auto-managed)
 *
 * Features:
 * - Auto-creates /logs directory if needed
 * - Upserts failure records to avoid duplicates
 * - Pretty-prints JSON for human readability
 * - Includes timestamp and formatted time for analysis
 *
 * @module FileLogger
 */

import path from 'path';
import * as fs from 'fs/promises';
import { FetchResponseActuacionType,
  ProcessRequest, } from '../types/actuaciones.js';
import { formatDateToString } from '../utils/ensureDate.js';

const NEW_ITEMS_LOG_FILE
  = process.env.NEW_ITEMS_LOG_FILE || 'new_actuaciones_accumulator.json';

/**
 * FileLogger - Persists operation failures and new actions to JSON files
 *
 * This logger is used throughout the sync process to track:
 * - When and why sync operations failed
 * - Which new actions were discovered
 * - Detailed error context for manual review/retry
 *
 * Files are stored in ./logs/ directory with pretty-printing for readability.
 * Failure logs use upsert logic to consolidate duplicate entries.
 *
 * Usage:
 * ```typescript
 * const logger = new FileLogger('failed_sync_ops.json');
 *
 * try {
 *   // Attempt database operation
 * } catch (err) {
 *   await logger.logFailure(processId, item, err.message, 'DB_ITEM');
 * }
 * ```
 *
 * @class FileLogger
 */
export class FileLogger {
  private filePath: string;

  /**
   * Constructs a FileLogger instance targeting a specific log file.
   *
   * The logger automatically creates the ./logs directory if it doesn't exist.
   * Multiple loggers can be instantiated with different filenames to segregate
   * records by type or concern (errors, new items, etc).
   *
   * @param {string} filename - The JSON filename to log to (e.g., 'failed_sync_ops.json')
   *                           File will be created at: ./logs/{filename}
   *
   * @example
   * const failureLogger = new FileLogger('failed_sync_ops.json');
   * const newItemsLogger = new FileLogger('new_items.json');
   */
  constructor(
    filename: string
  ) {
    this.filePath = path.join(
      process.cwd(), 'logs', filename
    );
    this.ensureDir();
  }

  /**
   * Ensures the ./logs directory exists, creating it recursively if needed.
   *
   * This method is called automatically in the constructor.
   * It uses fs.mkdir with recursive: true to safely create the directory
   * even if parent directories don't exist. Errors are silently ignored
   * (e.g., if directory already exists).
   *
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async ensureDir() {
    try {
      await fs.mkdir(
        path.dirname(
          this.filePath
        ), {
          recursive: true,
        }
      );
    } catch {
      /* ignore */
    }
  }

  /**
   * Logs a failed operation during the synchronization process.
   *
   * Records details about operations that encountered errors:
   * - API fetch failures
   * - Database insert/update errors
   * - Webhook delivery failures
   * - Telegram notification failures
   *
   * **Deduplication Logic:**
   * - If an entry with the same contextId exists, it's replaced (upsert)
   * - If contextId='0' (unknown), matches by carpetaNumero instead
   * - Prevents log file from growing indefinitely with duplicates
   *
   * **Log Entry Structure:**
   * ```json
   * {
   *   "timestamp": "2026-03-04T15:30:45.123Z",
   *   "formatedTimeStamp": "2026-03-04 15:30:45",
   *   "phase": "DB_ITEM",
   *   "parentId": "123456",
   *   "error": "Unique constraint violation on idRegActuacion",
   *   "data": { originalSubItem },
   *   "carpetaNumero": 1
   * }
   * ```
   *
   * @public
   * @async
   * @param {string | number} contextId - The parent process/context ID (used for matching)
   *                                       Pass '0' if unknown to match by carpetaNumero
   * @param {any} subItem - The data item being processed when failure occurred
   *                       Can be an Actuacion, Process, or other domain object
   * @param {string} error - The error message describing what went wrong
   * @param {'FETCH' | 'DB_ITEM' | 'WEBHOOK' | 'TELEGRAM'} phase
   *        Which stage of processing failed:
   *        - 'FETCH': API call failed
   *        - 'DB_ITEM': Database insert/update failed
   *        - 'WEBHOOK': External webhook delivery failed
   *        - 'TELEGRAM': Telegram notification failed
   * @returns {Promise<void>}
   *
   * @example
   * try {
   *   await client.actuacion.create({ data: input });
   * } catch (err) {
   *   await logger.logFailure(
   *     processId,
   *     actuacionData,
   *     `Duplicate entry: ${err.message}`,
   *     'DB_ITEM'
   *   );
   * }
   */
  public async logFailure(
    contextId: string | number,
    subItem: any,
    error: string,
    phase: 'FETCH' | 'DB_ITEM' | 'WEBHOOK' | 'TELEGRAM' | "DECODE_ITEM",
  ) {
    const carpetaNumero
      = subItem?.carpetaNumero
      || subItem?.data?.carpetaNumero
      || subItem?.proceso?.carpetaNumero
      || null;

    const logTime = new Date();
    const formatedLogTime = formatDateToString(
      logTime
    );

    const logEntry = {
      timestamp        : logTime.toISOString(),
      formatedTimeStamp: formatedLogTime,
      phase,
      parentId         : contextId,
      error,
      data             : subItem,
      carpetaNumero    : carpetaNumero,
    };

    try {
      let currentData: any[] = [];

      try {
        const fileContent = await fs.readFile(
          this.filePath, 'utf-8'
        );
        currentData = JSON.parse(
          fileContent
        );

        if ( !Array.isArray(
          currentData
        ) ) {
          currentData = [];
        }
      } catch {
        currentData = [];
      }

      const existingIndex = currentData.findIndex(
        (
          item
        ) => {
          const incomingId = String(
            contextId
          );
          const itemId = String(
            item.parentId
          );

          if ( incomingId !== '0' && itemId === incomingId ) {
            return true;
          }

          const itemCarpeta = item.carpetaNumero || item.data?.carpetaNumero;

          if (
            carpetaNumero
          && itemCarpeta
          && String(
            itemCarpeta
          ) === String(
            carpetaNumero
          )
          ) {
            return true;
          }

          return false;
        }
      );

      if ( existingIndex !== -1 ) {
        currentData[ existingIndex ] = logEntry;
      } else {
        currentData.push(
          logEntry
        );
      }

      await fs.writeFile(
        this.filePath,
        JSON.stringify(
          currentData, null, 2
        ),
        'utf-8',
      );
    } catch ( e ) {
      console.log(
        'Failed to write to log file', e
      );
    }
  }

  /**
   * Accumulates newly detected 'Actuaciones' into a JSON file for backup and review.
   * Uses an upsert logic based on the `carpetaNumero` to maintain the latest status.
   * * @param newItems - Array of newly fetched Actuaciones.
   * @param parentProc - The parent process metadata.
   */
  public async logNewItems(
    newItems: FetchResponseActuacionType[],
    parentProc: ProcessRequest,
  ) {
    const filePath = path.join(
      process.cwd(), 'logs', NEW_ITEMS_LOG_FILE
    );

    const itemsToSave = newItems.map(
      (
        item
      ) => {
        return {
          ...item,
          _meta: {
            detectedAt: new Date()
              .toISOString(),
            carpetaNumero: parentProc.carpetaNumero,
            processId    : parentProc.idProceso,
          },
        };
      }
    );

    try {
      let currentData: any[] = [];

      try {
        const fileContent = await fs.readFile(
          filePath, 'utf-8'
        );
        currentData = JSON.parse(
          fileContent
        );

        if ( !Array.isArray(
          currentData
        ) ) {
          currentData = [];
        }
      } catch {
        currentData = [];
      }

      for ( const newItem of itemsToSave ) {
        const existingIndex = currentData.findIndex(
          (
            existing
          ) => {
            return (
              existing._meta
            && existing._meta.carpetaNumero === newItem._meta.carpetaNumero
            );
          }
        );

        if ( existingIndex !== -1 ) {
          currentData[ existingIndex ] = newItem;
        } else {
          currentData.push(
            newItem
          );
        }
      }

      await fs.writeFile(
        filePath,
        JSON.stringify(
          currentData, null, 2
        ),
        'utf-8',
      );
    } catch ( error ) {
      console.log(
        '❌ Failed to save new items to JSON file:', error
      );
    }
  }
}
