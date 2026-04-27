import {
  SQSClient,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { config } from '../config/config';
import { ExpireBookingService } from '../service/ExpireBookingService';

export class CheckBookingSqsListener {
  private readonly sqsClient: SQSClient;
  private queueUrl: string | null = null;
  private running = false;

  constructor(private readonly expireBookingService: ExpireBookingService) {
    this.sqsClient = new SQSClient({
      region: config.aws.region,
      ...(config.aws.endpointUrl ? { endpoint: config.aws.endpointUrl } : {}),
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
  }

  private async getQueueUrl(): Promise<string> {
    if (this.queueUrl) return this.queueUrl;
    const response = await this.sqsClient.send(
      new GetQueueUrlCommand({ QueueName: config.sqs.queueName }),
    );
    if (!response.QueueUrl) {
      throw new Error(`SQS queue not found: ${config.sqs.queueName}`);
    }
    this.queueUrl = response.QueueUrl;
    return this.queueUrl;
  }

  start(): void {
    this.running = true;
    this.poll().catch((err) => console.error('[SQS Listener] Fatal error:', err));
  }

  stop(): void {
    this.running = false;
  }

  private async poll(): Promise<void> {
    while (this.running) {
      try {
        const queueUrl = await this.getQueueUrl();
        const response = await this.sqsClient.send(
          new ReceiveMessageCommand({
            QueueUrl: queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: 20, // long polling
          }),
        );

        const messages = response.Messages ?? [];
        for (const message of messages) {
          await this.processMessage(queueUrl, message);
        }
      } catch (err) {
        console.error('[SQS Listener] Error polling queue:', err);
        // Back off briefly before retrying
        await sleep(5000);
      }
    }
  }

  private async processMessage(
    queueUrl: string,
    message: { Body?: string; ReceiptHandle?: string },
  ): Promise<void> {
    try {
      if (!message.Body) return;
      const dto = JSON.parse(message.Body) as { bookingId: number };
      console.info(`[SQS Listener] Processing booking expiration check: bookingId=${dto.bookingId}`);

      await this.expireBookingService.expireBooking(dto.bookingId);

      // Delete message on success
      await this.sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
      console.info(`[SQS Listener] Message processed: bookingId=${dto.bookingId}`);
    } catch (err) {
      // Leave message in queue to be reprocessed (visibility timeout will expire)
      console.error('[SQS Listener] Error processing message:', err);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
