/* eslint-disable @typescript-eslint/no-explicit-any */

// ==========================================
// 5. INFRASTRUCTURE SERVICES (TELEGRAM FIX)
// ==========================================

import { ApiError, FetchResponseActuacion, fetchWithSmartRetry, ProcessRequest } from './syncronize_newest_actuaciones_test_2.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

export class TelegramService {
  // ... (keep cleanText method as is) ...
  private static cleanText( text: string | null | undefined ): string {
    // ... your existing code ...
    if ( !text ) {
      return '';
    }

    return text.toString()
      .replace(
        /&/g, '&amp;'
      )
      .replace(
        /</g, '&lt;'
      )
      .replace(
        />/g, '&gt;'
      )
      .replace(
        /"/g, '&quot;'
      )
      .replace(
        /'/g, '&#039;'
      );
  }

  static async sendNotification(
    actuacion: FetchResponseActuacion,
    processInfo: ProcessRequest,
  ) {
    if ( !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID ) {
      return;
    }

    const cleanActuacion = this.cleanText( actuacion.actuacion );
    const cleanAnotacion = this.cleanText( actuacion.anotacion );
    const cleanLlave = this.cleanText( processInfo.llaveProceso );

    const message = `
🚨 <b>NUEVA ACTUACIÓN DETECTADA</b> 🚨

👤 <b>Nombre:</b> ${ processInfo.nombre }
📂 <b>Expediente:</b> ${ cleanLlave }
📁 <b>Carpeta:</b> ${ processInfo.carpetaNumero }

📅 <b>Fecha:</b> ${ new Date( actuacion.fechaActuacion )
  .toLocaleDateString() }
📝 <b>Actuación:</b> ${ cleanActuacion }
${ cleanAnotacion
  ? `ℹ️ <b>Anotación:</b> ${ cleanAnotacion }`
  : '' }
🔗 <a href='https://app.rsasesorjuridico.com/Carpeta/${ processInfo.carpetaNumero }/ultimasActuaciones/${ processInfo.idProceso }'>Ver en app</a>`;

    try {
      // ✅ USE SMART RETRY HERE
      // We DO NOT pass headers for 'Origin' or 'User-Agent' here, Telegram doesn't need them.
      await fetchWithSmartRetry(
        `https://api.telegram.org/bot${ TELEGRAM_BOT_TOKEN }/sendMessage`,
        {
          method : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify( {
            chat_id                 : TELEGRAM_CHAT_ID,
            text                    : message,
            parse_mode              : 'HTML',
            disable_web_page_preview: true,
          } ),
        },
        3,    // Max Retries
        3000  // Base Delay (3 seconds is safer for Telegram)
      );

    } catch ( err: any ) {
      if ( err.statusCode === 403 ) {
        console.error( '❌ TELEGRAM 403: The bot cannot message this user. Ensure you have sent /start to the bot.' );
        console.log( '❌ TELEGRAM 403: The bot cannot message this user. Ensure you have sent /start to the bot.' );

        return; // Don't try fallback if we are blocked
      }

      console.warn( '⚠️ Standard HTML message failed, attempting fallback...' );
      console.log( '⚠️ Standard HTML message failed, attempting fallback...' );
      await this.sendFallbackMessage(
        actuacion, processInfo
      );
    }
  }

  private static async sendFallbackMessage(
    actuacion: FetchResponseActuacion,
    processInfo: ProcessRequest,
  ) {
    try {

      const message = `🚨 NUEVA ACTUACIÓN 🚨\n\nNombre: ${ processInfo.nombre }\nExpediente: ${ processInfo.carpetaNumero }\nActuación: ${ actuacion.actuacion }${ actuacion.anotacion
        ? `\nAnotación: ${ actuacion.anotacion }`
        : '' } \n https://app.rsasesorjuridico.com/Carpeta/${ processInfo.carpetaNumero }/ultimasActuaciones/${ processInfo.idProceso }`;

      // Simple fetch for fallback, no complex retry needed to avoid infinite loops
      await fetch(
        `https://api.telegram.org/bot${ TELEGRAM_BOT_TOKEN }/sendMessage`, {
          method : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify( {
            chat_id: TELEGRAM_CHAT_ID,
            text   : message
          } ),
        }
      );
    } catch ( error ) {
      if ( error instanceof Error ) {
        throw new ApiError(
          error.message, `${ processInfo.carpetaNumero } TelegramService.sendFallbackMessage `
        );
      }
    }
  }
}