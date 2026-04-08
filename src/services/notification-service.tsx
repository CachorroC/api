/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiError } from '../models/ApiError.js';
import { FileLogger } from '../models/FileLogger.js';

const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

export class NotificationService {
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
  ) {
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
    }
  }
}
