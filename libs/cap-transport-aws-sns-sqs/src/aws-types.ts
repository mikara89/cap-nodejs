export interface SnsClient {
  send(command: { input: Record<string, unknown> }): Promise<unknown>;
  destroy(): void;
}

export interface SqsClient {
  send(command: { input: Record<string, unknown> }): Promise<unknown>;
  destroy(): void;
}

export interface AwsClientFactory {
  snsClient(
    region: string,
    credentials?: AwsCredentials,
    endpoint?: string,
  ): SnsClient;
  sqsClient(
    region: string,
    credentials?: AwsCredentials,
    endpoint?: string,
  ): SqsClient;
}

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

export type AwsFactory = (
  region: string,
  credentials?: AwsCredentials,
  endpoint?: string,
) => AwsClientFactory;
