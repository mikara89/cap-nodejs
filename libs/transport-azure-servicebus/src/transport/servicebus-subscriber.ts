import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  ServiceBusClient,
  ServiceBusReceiver,
  ProcessErrorArgs,
  ServiceBusAdministrationClient,
} from '@azure/service-bus';
import { ServiceBusConfig } from '../servicebus.config';
import { ISubscriber } from '@cap/cap-nest';

@Injectable()
export class ServiceBusSubscriber implements ISubscriber, OnModuleDestroy {
  private readonly logger = new Logger(ServiceBusSubscriber.name);
  private readonly receivers = new Map<string, ServiceBusReceiver>();
  private readonly topicPrefix: string;
  private readonly subscriptionPrefix: string;
  private admin?: ServiceBusAdministrationClient;
  private createQueues = false;
  private _config?: ServiceBusConfig;

  constructor(
    private readonly client: ServiceBusClient,
    configOrTopicPrefix?: ServiceBusConfig | string,
    subscriptionPrefix?: string,
  ) {
    if (typeof configOrTopicPrefix === 'string') {
      this.topicPrefix = configOrTopicPrefix;
      this.subscriptionPrefix = subscriptionPrefix ?? 'sub-';
    } else {
      const cfg = configOrTopicPrefix;
      this.topicPrefix = cfg?.topicPrefix ?? 'cap-';
      this.subscriptionPrefix = cfg?.subscriptionPrefix ?? 'sub-';
      // keep admin client creation for initialize() when requested
      if (cfg) {
        // stash the config so initialize() and consume() can access it
        this._config = cfg;
      }
    }
  }

  async initialize?(options?: {
    autoInit?: boolean;
    createQueues?: boolean;
  }): Promise<void> {
    if (!(options && (options.autoInit || options.createQueues)))
      return Promise.resolve();
    this.createQueues = Boolean(options.autoInit ?? options.createQueues);
    try {
      // Log received init options for debugging
      this.logger.debug(`ServiceBusSubscriber.initialize() options`, options);

      // If we have the transport config available from construction, build
      // the admin client now so consume() can create topics/subscriptions.
      const cfg: ServiceBusConfig | undefined = this._config;
      if (cfg?.connectionString) {
        try {
          this.logger.debug(
            'Attempting to create ServiceBusAdministrationClient (connection string present)',
          );
          this.admin = new ServiceBusAdministrationClient(cfg.connectionString);
          this.logger.log(
            'ServiceBusSubscriber.initialize() created admin client for provisioning',
          );
        } catch (err) {
          this.logger.warn(
            'Failed creating ServiceBusAdministrationClient',
            err as Error,
          );
        }
      } else {
        this.logger.log(
          'ServiceBusSubscriber.initialize() called — no connection string available for admin ops',
        );
      }
    } catch (err) {
      this.logger.warn(
        'ServiceBusSubscriber.initialize() encountered an error',
        err as Error,
      );
    }
  }

  async consume(
    topic: string,
    group: string,
    onMessage: (
      payload: unknown,
      properties?: Record<string, unknown>,
    ) => Promise<void>,
  ): Promise<void> {
    const cfg: ServiceBusConfig | undefined = this._config;
    const isQueueMode = cfg?.mode === 'queue';
    const queuePrefix: string = cfg?.queuePrefix ?? this.topicPrefix;
    const resourcePrefix = isQueueMode ? queuePrefix : this.topicPrefix;
    const resourceName = resourcePrefix + topic;
    const subscriptionName = isQueueMode
      ? undefined
      : this.subscriptionPrefix + group;
    const defaultSubscriptionName = this.subscriptionPrefix + group;
    const key = isQueueMode
      ? resourceName
      : `${resourceName}/${subscriptionName}`;

    if (this.receivers.has(key)) {
      this.logger.warn(`Subscriber already exists for ${key}`);
      return;
    }

    this.logger.debug(
      `Provisioning check for ${key} (createQueues=${this.createQueues})`,
    );
    // If admin client wasn't created during initialize(), try to build it lazily
    if (!this.admin && this.createQueues) {
      const storedCfg = this._config;
      if (storedCfg?.connectionString) {
        try {
          this.logger.debug(
            'Creating admin client lazily from stored transport config',
          );
          this.admin = new ServiceBusAdministrationClient(
            storedCfg.connectionString,
          );
          this.logger.log('ServiceBusSubscriber: admin client created lazily');
        } catch (err) {
          this.logger.warn(
            'Failed to create admin client lazily',
            err as Error,
          );
        }
      } else {
        this.logger.debug(
          'No stored transport connection string to create admin client lazily',
        );
      }
    }

    let actualIsQueue = isQueueMode;
    let actualSubscriptionName = subscriptionName;

    if (this.admin && this.createQueues) {
      try {
        if (isQueueMode) {
          this.logger.debug(`Checking queue ${resourceName}`);
          try {
            await this.admin.getQueue(resourceName);
            this.logger.debug(`Queue ${resourceName} already exists`);
          } catch {
            this.logger.debug(
              `Queue ${resourceName} not found; checking for topic with same name`,
            );
            // If a topic exists with the same name, fall back to topic+subscription
            try {
              await this.admin.getTopic(resourceName);
              this.logger.log(
                `A topic named ${resourceName} exists; will attach via subscription instead of queue`,
              );
              actualIsQueue = false;
              actualSubscriptionName = this.subscriptionPrefix + group;
              // ensure the subscription exists
              try {
                await this.admin.getSubscription(
                  resourceName,
                  actualSubscriptionName,
                );
                this.logger.debug(
                  `Subscription ${actualSubscriptionName} for ${resourceName} already exists`,
                );
              } catch {
                this.logger.log(
                  `Subscription ${actualSubscriptionName} for ${resourceName} not found, attempting to create`,
                );
                try {
                  await this.admin.createSubscription(
                    resourceName,
                    actualSubscriptionName,
                  );
                  this.logger.log(
                    `Created subscription ${actualSubscriptionName} for ${resourceName}`,
                  );
                } catch (createSubErr) {
                  this.logger.warn(
                    `Failed creating subscription ${actualSubscriptionName} for ${resourceName}`,
                    createSubErr as Error,
                  );
                }
              }
            } catch {
              // No topic exists either — attempt to create a queue
              this.logger.log(
                `No topic found named ${resourceName}; attempting to create queue`,
              );
              try {
                await this.admin.createQueue(resourceName);
                this.logger.log(`Created queue ${resourceName}`);
              } catch (createQueueErr) {
                this.logger.warn(
                  `Failed creating queue ${resourceName}`,
                  createQueueErr as Error,
                );
              }
            }
          }
        } else {
          // Topic + subscription
          this.logger.debug(`Checking topic ${resourceName}`);
          try {
            await this.admin.getTopic(resourceName);
            this.logger.debug(`Topic ${resourceName} already exists`);
          } catch {
            this.logger.log(
              `Topic ${resourceName} not found, attempting to create`,
            );
            try {
              await this.admin.createTopic(resourceName);
              this.logger.log(`Created topic ${resourceName}`);
            } catch (e) {
              this.logger.warn(
                `Failed creating topic ${resourceName}`,
                e as Error,
              );
            }
          }

          // Subscription
          const subName = subscriptionName ?? defaultSubscriptionName;
          this.logger.debug(
            `Checking subscription ${subName} for topic ${resourceName}`,
          );
          try {
            await this.admin.getSubscription(resourceName, subName);
            this.logger.debug(
              `Subscription ${subName} for ${resourceName} already exists`,
            );
          } catch {
            this.logger.log(
              `Subscription ${subName} for ${resourceName} not found, attempting to create`,
            );
            try {
              await this.admin.createSubscription(resourceName, subName);
              this.logger.log(
                `Created subscription ${subName} for ${resourceName}`,
              );
            } catch (e) {
              this.logger.warn(
                `Failed creating subscription ${subName} for ${resourceName}`,
                e as Error,
              );
            }
          }
        }
      } catch (err) {
        this.logger.warn(
          'Provisioning checks encountered an error',
          err as Error,
        );
      }
    } else if (!this.createQueues) {
      this.logger.debug('createQueues not enabled; skipping provisioning');
    } else {
      this.logger.debug('No admin client available; skipping provisioning');
    }

    // create receiver and subscribe — use the actual resolved mode (queue or topic/sub)
    let receiver: ServiceBusReceiver;
    if (actualIsQueue) {
      receiver = this.client.createReceiver(resourceName);
    } else {
      const finalSubscription =
        actualSubscriptionName ?? defaultSubscriptionName;
      receiver = this.client.createReceiver(resourceName, finalSubscription);
    }

    receiver.subscribe({
      processMessage: async (msg) => {
        try {
          await onMessage(
            msg.body,
            (msg.applicationProperties ?? {}) as Record<string, unknown>,
          );
        } catch (err) {
          this.logger.warn(`Handler error for ${key}`, err as Error);
          throw err;
        }
      },
      processError: (args: ProcessErrorArgs) => {
        this.logger.error(
          `Error from ${key}: ${args.error?.message}`,
          args.error,
        );
        return Promise.resolve();
      },
    });

    this.receivers.set(key, receiver);
    this.logger.log(`subscribed to ${key}`);
  }

  async onModuleDestroy(): Promise<void> {
    for (const [key, receiver] of this.receivers.entries()) {
      try {
        await receiver.close();
        this.logger.debug(`closed receiver for ${key}`);
      } catch (error) {
        this.logger.warn(`failed to close receiver for ${key}`, error);
      }
    }
    this.receivers.clear();
  }
}
