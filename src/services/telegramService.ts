/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @module services/telegramService
 * @description Telegram Notification Infrastructure Service
 * 
 * Handles dispatching HTML-formatted notifications to a configured Telegram chat.
 * Used to alert users/administrators about newly detected judicial updates (actuaciones).
 * 
 * NOTIFICATION WORKFLOW:
 * Actuación Detection → Build HTML Message
 *   ↓
 * Escape HTML entities (cleanText) to prevent Telegram API rejections
 *   ↓
 * POST to Telegram Bot API with parse_mode: 'HTML'
 *   ↓
 * If HTML fails due to parse error:
 *   → Fall back to plain-text message (sendFallbackMessage)
 *   → Retry with simplified format
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - TELEGRAM_BOT_TOKEN: Bot API token from @BotFather
 * - TELEGRAM_CHAT_ID: Target chat ID (user ID or group ID)
 * 
 * ERROR HANDLING:
 * - Status 403: User blocked bot or hasn't started it (skip fallback)
 * - Other HTTP errors: Attempt fallback message
 * - JSON parsing errors: Caught and logged, returns gracefully
 * 
 * RATE LIMITING:
 * Uses fetchWithSmartRetry with 3-second base delay to avoid Telegram API throttling.
 * Telegram typically allows 30 messages/second, so individual retries are safe.
 */

import { ApiError } from '../models/ApiError.js';
import { FetchResponseActuacionType,
  ProcessRequest, } from '../types/actuaciones.js';
import { fetchWithSmartRetry } from '../utils/fetchWithSmartRetry.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

/**
 * @class TelegramService
 * @description Infrastructure service responsible for dispatching alerts to a configured Telegram chat.
 * Used primarily to notify users or administrators about newly detected judicial updates (actuaciones).
 * Includes an automatic text-sanitization process and a plain-text fallback mechanism in case
 * Telegram's strict HTML parser rejects the primary message.
 */
export class TelegramService {
  /**
   * @private
   * @static
   * @method cleanText
   * @description Sanitizes strings by escaping characters that conflict with Telegram's HTML `parse_mode`.
   * Replaces `&`, `<`, `>`, `"`, and `'` with their respective HTML entities to prevent API 400 errors.
   * * @param {string | null | undefined} text - The raw string that needs to be escaped.
   * @returns {string} The safely escaped string, or an empty string if the input is null/undefined.
   */
  private static cleanText(
    text: string | null | undefined 
  ): string {
    if ( !text ) {
      return '';
    }

    return text
      .toString()
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

  /**
   * @static
   * @async
   * @method sendNotification
   * @description Constructs and sends an HTML-formatted Telegram notification about a new "Actuación".
   * Utilizes `fetchWithSmartRetry` to handle rate limits or temporary network issues.
   * If the formatted message fails (e.g., due to unescaped HTML edge cases), it automatically
   * triggers `sendFallbackMessage`.
   * * @param {FetchResponseActuacion} actuacion - The data object containing details of the new judicial update.
   * @param {ProcessRequest} processInfo - Contextual information about the process (name, folder number, IDs).
   * @returns {Promise<void>} Resolves when the message is successfully sent or caught by the fallback.
   * * @example
   * await TelegramService.sendNotification(nuevaActuacion, {
   * nombre: 'Juan Perez',
   * carpetaNumero: 123,
   * llaveProceso: '11001400...',
   * idProceso: 456
   * });
   */
  static async sendNotification(
    actuacion: FetchResponseActuacionType,
    processInfo: ProcessRequest,
  ): Promise<void> {
    if ( !TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID ) {
      return;
    }

    const cleanActuacion = this.cleanText(
      actuacion.actuacion 
    );
    const cleanAnotacion = this.cleanText(
      actuacion.anotacion 
    );
    const cleanLlave = this.cleanText(
      processInfo.llaveProceso 
    );

    const message = `
🚨 <b>NUEVA ACTUACIÓN DETECTADA</b> 🚨

👤 <b>Nombre:</b> ${ processInfo.nombre }
📂 <b>Expediente:</b> ${ cleanLlave }
📁 <b>Carpeta:</b> ${ processInfo.carpetaNumero }

📅 <b>Fecha:</b> ${ new Date(
  actuacion.fechaActuacion 
)
  .toLocaleDateString() }
📝 <b>Actuación:</b> ${ cleanActuacion }
${ cleanAnotacion
  ? `ℹ️ <b>Anotación:</b> ${ cleanAnotacion }`
  : '' }
🔗 <a href='https://app.rsasesorjuridico.com/Carpeta/${ processInfo.carpetaNumero }/ultimasActuaciones/${ processInfo.idProceso }'>Ver en app</a>`;

    try {
      // ✅ USE SMART RETRY HERE
      // We DO NOT pass headers for 'Origin' or 'User-Agent' here, Telegram doesn't need them.
      const fetchTelegramBot = await fetchWithSmartRetry(
        `https://api.telegram.org/bot${ TELEGRAM_BOT_TOKEN }/sendMessage`,
        {
          method : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            {
              chat_id                 : TELEGRAM_CHAT_ID,
              text                    : message,
              parse_mode              : 'HTML',
              disable_web_page_preview: true,
            } 
          ),
        },
        3, // Max Retries
        3000, // Base Delay (3 seconds is safer for Telegram)
      );

      if ( !fetchTelegramBot.ok ) {
        throw new Error(
          `📛Telegram API request failed with status ${ fetchTelegramBot.status } code ${ fetchTelegramBot.statusText }`,
        );
      } else if ( fetchTelegramBot.ok ) {
        console.log(
          `✅ Telegram notification sent successfully for expediente ${ processInfo.carpetaNumero }, ${ fetchTelegramBot.statusText }`,
        );
      }
    } catch ( err: any ) {
      // 🚫 403 signifies the user blocked the bot or hasn't started it
      if ( err.statusCode === 403 || err.message?.includes(
        '403' 
      ) ) {
        console.error(
          '❌ TELEGRAM 403: The bot cannot message this user. Ensure you have sent /start to the bot.',
        );

        return; // Don't try fallback if we are actively blocked
      }

      console.warn(
        '⚠️ Standard HTML message failed, attempting fallback...' 
      );
      await this.sendFallbackMessage(
        actuacion, processInfo 
      );
    }
  }

  /**
   * @private
   * @static
   * @async
   * @method sendFallbackMessage
   * @description A recovery mechanism that sends a simplified, plain-text version of the alert.
   * Triggered when `sendNotification` fails, typically due to malformed HTML that bypasses `cleanText`.
   * * @param {FetchResponseActuacion} actuacion - The data object containing the update details.
   * @param {ProcessRequest} processInfo - Contextual information about the associated process.
   * @throws {ApiError} Throws a custom API error if the fallback message also fails to send.
   * @returns {Promise<void>}
   */
  private static async sendFallbackMessage(
    actuacion: FetchResponseActuacionType,
    processInfo: ProcessRequest,
  ): Promise<void> {
    try {
      const message = `🚨 NUEVA ACTUACIÓN 🚨\n\nNombre: ${ processInfo.nombre }\nExpediente: ${ processInfo.carpetaNumero }\nActuación: ${ actuacion.actuacion }${
        actuacion.anotacion
          ? `\nAnotación: ${ actuacion.anotacion }`
          : ''
      } \n https://app.rsasesorjuridico.com/Carpeta/${ processInfo.carpetaNumero }/ultimasActuaciones/${ processInfo.idProceso }`;

      // Simple fetch for fallback, retaining smart retry but without formatting complexity
      await fetchWithSmartRetry(
        `https://api.telegram.org/bot${ TELEGRAM_BOT_TOKEN }/sendMessage`,
        {
          method : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            {
              chat_id: TELEGRAM_CHAT_ID,
              text   : message,
            } 
          ),
        },
      );
    } catch ( error ) {
      if ( error instanceof Error ) {
        throw new ApiError(
          error.message,
          `${ processInfo.carpetaNumero } TelegramService.sendFallbackMessage `,
        );
      }
    }
  }
}
