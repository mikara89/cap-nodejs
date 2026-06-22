/**
 * Configuration options for Azure Service Bus transport.
 */
export interface ServiceBusConfig {
  /**
   * Azure Service Bus connection string.
   * Get this from Azure Portal > Service Bus Namespace > Shared access policies.
   */
  connectionString: string;

  /**
   * Prefix to add to all topic names.
   * Default: 'cap-'
   */
  topicPrefix?: string;

  /**
   * Prefix to add to all subscription names.
   * Default: 'cap-sub-'
   */
  subscriptionPrefix?: string;

  /**
   * Maximum number of concurrent message handlers per subscription.
   * Default: 1
   */
  maxConcurrentCalls?: number;
  /**
   * Mode of operation: 'topic' (publish/subscribe) or 'queue' (point-to-point).
   * Default: 'topic'
   */
  mode?: 'topic' | 'queue';

  /**
   * Prefix to add to all queue names when `mode: 'queue'`.
   * If not set, `topicPrefix` is used.
   */
  queuePrefix?: string;
}
