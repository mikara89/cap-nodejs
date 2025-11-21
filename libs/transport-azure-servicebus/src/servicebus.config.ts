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
}
