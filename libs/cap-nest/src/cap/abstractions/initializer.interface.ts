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
 * initialization (schema creation, queue setup, etc.). Keeping this
 * minimal so adapters can opt-in easily.
 */
export abstract class AdapterInitializer {
  abstract initialize(options?: InitOptions): Promise<void>;
}
