/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiError } from '../models/ApiError.js';
import { FileLogger } from '../models/FileLogger.js';

const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

/**
 * @class NotificationService
 * @description Service responsible for processing and sending push notifications via webhooks.
 * Handles the dispatch of alerts with optional associated data and interactive actions.
 */
export class NotificationService {
  /**
   * @static
   * @async
   * @method processNotifications
   * @description Sends a notification request to the configured webhook URL.
   * If the request fails, it logs the failure to a local file for later inspection.
   *
   * @param {Object} params - The notification parameters object.
   * @param {string} params.title - The headline title of the notification.
   * @param {string} params.body - The main message content of the notification.
   * @param {any} [params.additionalData] - Optional metadata to be included in the notification payload.
   * @param {Array<{action: string, title: string}>} [params.actions] - Optional list of interactive buttons or actions.
   *
   * @returns {Promise<{ successful: boolean }>} An object indicating if the notification was sent successfully.
   *
   * @example
   * const result = await NotificationService.processNotifications({
   *   title: 'New Update',
   *   body: 'A new document has been added to your case.',
   *   additionalData: { folderId: 123 },
   *   actions: [{ action: 'view_details', title: 'View' }]
   * });
   * console.log(result.successful); // true or false
   */
  static async processNotifications(
    {
      title,
      body,
      additionalData,
      actions,
    }: {
      title          : string;
      body           : string;
      additionalData?: any;
      actions?       : {
        action: string;
        title : string
      }[];
    }
  ): Promise<{ successful: boolean; }> {
    const logger = new FileLogger(
      'failed_notification_service.json'
    );

    try {
      const response = await fetch(
        WEBHOOK_URL, {
          method : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'CF-Access-Client-Id':
            process.env.CF_ACCESS_CLIENT_ID ?? '',
            'CF-Access-Client-Secret':
            process.env.CF_ACCESS_CLIENT_SECRET ?? '',
          },
          body: JSON.stringify(
            {
              title: title,
              body : body,
              data : additionalData
                ? additionalData
                : null,
              actions: actions
                ? actions
                : [],
            }
          ),
        }
      );
      console.log(
        `webhook fetch post request sent, response: ${ response.status } - ${ response.statusText }`
      );

      if ( !response.ok ) {
        throw new ApiError(
          `Status ${ response.status }`,
          'ActuacionService.processNotifications Webhook'
        );

      }

      if ( response.ok ) {
        return {
          successful: true
        };
      }

      return {
        successful: false
      };
    } catch ( postError: any ) {
      console.log(
        `⚠️ Webhook Failed: ${ postError.message }`
      );
      await logger.logFailure(
        WEBHOOK_URL,
        {
          data: {
            title,
            body,
            ...additionalData,
          },
        },
        postError.message,
        'WEBHOOK'
      );

      return {
        successful: false
      };
    }
  }
}
