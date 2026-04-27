import { SQSClient, GetQueueUrlCommand, SendMessageCommand } from '@aws-sdk/client-sqs';
import { config } from '../config/config';

export class BookingExpirationService {
  private readonly sqsClient: SQSClient;
  private queueUrl: string | null = null;

  constructor() {
    this.sqsClient = new SQSClient({
      region: config.aws.region,
      ...(config.aws.endpointUrl
        ? { endpoint: config.aws.endpointUrl }
        : {}),
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

  async scheduleExpirationCheck(bookingId: number): Promise<void> {
    const queueUrl = await this.getQueueUrl();
    const body = JSON.stringify({ bookingId });

    await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: body,
        DelaySeconds: config.sqs.bookingExpirationCheckSeconds,
      }),
    );
  }
}
