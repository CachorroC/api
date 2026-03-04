/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import * as fs from 'fs/promises';
import { FetchResponseActuacionType,
  ProcessRequest, } from '../types/actuaciones.js';
import { formatDateToString } from '../utils/ensureDate.js';

const NEW_ITEMS_LOG_FILE
  = process.env.NEW_ITEMS_LOG_FILE || 'new_actuaciones_accumulator.json';

export class FileLogger {
  private filePath: string;

  /**
   * @param filename - The name of the JSON log file to target within the `/logs` directory.
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
   * Ensures the `logs` directory exists, creating it recursively if necessary.
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
   * Upserts the error log based on Process ID or Carpeta Numero to avoid duplicate entries.
   * * @param contextId - The ID of the parent process (or '0' if unknown).
   * @param subItem - The specific data item being processed when the failure occurred.
   * @param error - The error message string.
   * @param phase - The pipeline phase where the error occurred ('FETCH', 'DB_ITEM', 'WEBHOOK', 'TELEGRAM').
   */
  public async logFailure(
    contextId: string | number,
    subItem: any,
    error: string,
    phase: 'FETCH' | 'DB_ITEM' | 'WEBHOOK' | 'TELEGRAM',
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
