/**
 * Initialization options for adapters.
 *
 * - `autoInit`: shorthand to request default initialization behavior.
 * - `createSchema`: storage adapters can create database schema/tables.
 * - `createQueues`: transport adapters can create queues/topics/subscriptions.
 */
export interface InitOptions {
  autoInit?: boolean;
  createSchema?: boolean;
  createQueues?: boolean;
}

/**
 * Simple abstract class adapters may implement to perform one-time
 * initialization such as schema creation or queue setup.
 */
export abstract class AdapterInitializer {
  abstract initialize(options?: InitOptions): Promise<void>;
}
