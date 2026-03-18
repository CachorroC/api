import 'dotenv/config'; // Must be first to load .env
import { ProcessRequest } from './types/actuaciones.js';
import { formatDateToString } from './utils/ensureDate.js';
import { RobustApiClient } from './models/RobustApiClient.js';
import { client } from './services/connection/prisma.js';
const RAMA_JUDICIAL_BASE_URL
  = process.env.RAMA_JUDICIAL_BASE_URL
  || 'https://consultaprocesos.ramajudicial.gov.co:448';

async function getProcesosToUpdate(): Promise<ProcessRequest[]> {
  const carpetas = await client.carpeta.findMany();

  return carpetas
    .flatMap(
      (
        carpeta
      ) => {
        const baseData = {
          carpetaNumero: carpeta.numero,
          llaveProceso : carpeta.llaveProceso,
          carpetaId    : carpeta.id,
          nombre       : carpeta.nombre,
          category     : carpeta.category,
        };

        if ( !carpeta.idProcesos || carpeta.idProcesos.length === 0 ) {
          return {
            ...baseData,
            idProceso: '0',
          };
        }

        return carpeta.idProcesos.map(
          (
            idProceso
          ) => {
            return {
              ...baseData,
              idProceso,
            };
          }
        );
      }
    )
    .sort(
      (
        a, b
      ) => {
        return b.carpetaNumero - a.carpetaNumero;
      }
    );
}

/**
 * The primary executor function acting as a cron-job controller.
 * It determines the current time window, filters the database items by their `category`,
 * and delegates the filtered batch to the `RobustApiClient`.
 */
async function runSync() {
  const startTime = new Date();
  const formattedCustomStartTime = formatDateToString(
    startTime
  );

  console.log(
    formattedCustomStartTime
  );
  console.log(
    `\n⏱️  Execution Started at: ${ formattedCustomStartTime }`
  );

  // --- FREQUENCY LOGIC ---
  const currentHour = startTime.getHours();
  const currentDay = startTime.getDay();

  // Time Windows
  const isMidnightRun = currentHour < 6;
  const isNoonRun = currentHour >= 12 && currentHour < 18;

  const api = new RobustApiClient(
    RAMA_JUDICIAL_BASE_URL
  );

  try {
    const allProcesses = await getProcesosToUpdate();

    const processesToCheck = allProcesses.filter(
      (
        proc
      ) => {
        const category = ( proc.category || 'default' )
          .toString()
          .toLowerCase()
          .trim();
        console.log(
          category
        );
/*
        if ( category === 'bancolombia' ) {
          console.log(
            `category is bancolombia ${ proc.carpetaNumero }`
          );

          return true; // Runs every window
        }

        if ( category === 'terminados' ) {
          return isMidnightRun && currentDay === 3; // Wednesday Midnight (Day 3)
        }

        if ( category === 'reintegra' ) {
          return isNoonRun;
        }

        return isNoonRun; */
        return true
      }
    );

    console.log(
      `🔎 Filter applied: Processing ${ processesToCheck.length } of ${ allProcesses.length } items.`,
    );

    if ( processesToCheck.length > 0 ) {
      await api.processBatch(
        processesToCheck, (
          proc
        ) => {
          return `/api/v2/Proceso/Actuaciones/${ proc.idProceso }`;
        }
      );
    } else {
      console.log(
        '😴 No processes scheduled for this run window.'
      );
    }

    console.log(
      '🎉 Sync Complete'
    );
  } catch ( error ) {
    console.log(
      'Fatal Error in runSync:', error
    );
  } finally {
    await client.$disconnect();

    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const seconds = Math.floor(
      ( durationMs / 1000 ) % 60
    );
    const minutes = Math.floor(
      ( durationMs / ( 1000 * 60 ) ) % 60
    );
    const hours = Math.floor(
      durationMs / ( 1000 * 60 * 60 )
    );
    const durationString = `${ hours }h ${ minutes }m ${ seconds }s`;

    const formattedCustomEndTime = formatDateToString(
      endTime
    );

    console.log(
      formattedCustomEndTime
    );
    console.log(
      `\n🏁 Execution Finished at: ${ formattedCustomEndTime }`
    );
    console.log(
      `⏱️  Total Duration: ${ durationString } (${ durationMs }ms)`
    );
  }
}

runSync();
