import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  ServiceBusClient,
  ServiceBusReceiver,
  ProcessErrorArgs,
  ServiceBusAdministrationClient,
} from '@azure/service-bus';
import { ServiceBusConfig } from '../servicebus.config';
import { ISubscriber, type CapHeaders } from '@cap/cap-nest';

type CapMessageHandler = (
  payload: unknown,
  properties?: CapHeaders,
) => Promise<void>;

interface SubscriptionTarget {
  resourceName: string;
  subscriptionName?: string;
  defaultSubscriptionName: string;
  key: string;
  isQueueMode: boolean;
  maxConcurrentCalls: number;
}

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
      if (cfg) {
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
      this.logger.debug(`ServiceBusSubscriber.initialize() options`, options);

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
          'ServiceBusSubscriber.initialize() called - no connection string available for admin ops',
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
    onMessage: CapMessageHandler,
  ): Promise<void> {
    const target = this.resolveSubscriptionTarget(topic, group);

    if (this.receivers.has(target.key)) {
      this.logger.warn(`Subscriber already exists for ${target.key}`);
      return;
    }

    this.logger.debug(
      `Provisioning check for ${target.key} (createQueues=${this.createQueues})`,
    );

    const provisionedTarget = await this.provisionTarget(target);
    const receiver = this.createReceiver(provisionedTarget);
    this.subscribeReceiver(provisionedTarget, receiver, onMessage);

    this.receivers.set(target.key, receiver);
    this.logger.log(`subscribed to ${target.key}`);
  }

  private resolveSubscriptionTarget(
    topic: string,
    group: string,
  ): SubscriptionTarget {
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

    return {
      resourceName,
      subscriptionName,
      defaultSubscriptionName,
      key,
      isQueueMode,
      maxConcurrentCalls: cfg?.maxConcurrentCalls ?? 1,
    };
  }

  private async provisionTarget(
    target: SubscriptionTarget,
  ): Promise<SubscriptionTarget> {
    this.ensureAdminClient();

    const admin = this.admin;
    if (admin && this.createQueues) {
      try {
        return target.isQueueMode
          ? await this.provisionQueueTarget(admin, target)
          : await this.provisionTopicSubscriptionTarget(admin, target);
      } catch (err) {
        this.logger.warn(
          'Provisioning checks encountered an error',
          err as Error,
        );
        return target;
      }
    }

    if (!this.createQueues) {
      this.logger.debug('createQueues not enabled; skipping provisioning');
    } else {
      this.logger.debug('No admin client available; skipping provisioning');
    }

    return target;
  }

  private ensureAdminClient(): void {
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
  }

  private async provisionQueueTarget(
    admin: ServiceBusAdministrationClient,
    target: SubscriptionTarget,
  ): Promise<SubscriptionTarget> {
    this.logger.debug(`Checking queue ${target.resourceName}`);
    try {
      await admin.getQueue(target.resourceName);
      this.logger.debug(`Queue ${target.resourceName} already exists`);
      return target;
    } catch {
      this.logger.debug(
        `Queue ${target.resourceName} not found; checking for topic with same name`,
      );
      return this.provisionQueueFallback(admin, target);
    }
  }

  private async provisionQueueFallback(
    admin: ServiceBusAdministrationClient,
    target: SubscriptionTarget,
  ): Promise<SubscriptionTarget> {
    try {
      await admin.getTopic(target.resourceName);
      this.logger.log(
        `A topic named ${target.resourceName} exists; will attach via subscription instead of queue`,
      );

      const topicTarget = {
        ...target,
        isQueueMode: false,
        subscriptionName: target.defaultSubscriptionName,
      };
      await this.ensureSubscription(admin, topicTarget);
      return topicTarget;
    } catch {
      this.logger.log(
        `No topic found named ${target.resourceName}; attempting to create queue`,
      );
      try {
        await admin.createQueue(target.resourceName);
        this.logger.log(`Created queue ${target.resourceName}`);
      } catch (createQueueErr) {
        this.logger.warn(
          `Failed creating queue ${target.resourceName}`,
          createQueueErr as Error,
        );
      }
      return target;
    }
  }

  private async provisionTopicSubscriptionTarget(
    admin: ServiceBusAdministrationClient,
    target: SubscriptionTarget,
  ): Promise<SubscriptionTarget> {
    await this.ensureTopic(admin, target.resourceName);
    await this.ensureSubscription(admin, target);
    return target;
  }

  private async ensureTopic(
    admin: ServiceBusAdministrationClient,
    resourceName: string,
  ): Promise<void> {
    this.logger.debug(`Checking topic ${resourceName}`);
    try {
      await admin.getTopic(resourceName);
      this.logger.debug(`Topic ${resourceName} already exists`);
    } catch {
      this.logger.log(`Topic ${resourceName} not found, attempting to create`);
      try {
        await admin.createTopic(resourceName);
        this.logger.log(`Created topic ${resourceName}`);
      } catch (err) {
        this.logger.warn(`Failed creating topic ${resourceName}`, err as Error);
      }
    }
  }

  private async ensureSubscription(
    admin: ServiceBusAdministrationClient,
    target: SubscriptionTarget,
  ): Promise<void> {
    const subName = target.subscriptionName ?? target.defaultSubscriptionName;
    this.logger.debug(
      `Checking subscription ${subName} for topic ${target.resourceName}`,
    );
    try {
      await admin.getSubscription(target.resourceName, subName);
      this.logger.debug(
        `Subscription ${subName} for ${target.resourceName} already exists`,
      );
    } catch {
      this.logger.log(
        `Subscription ${subName} for ${target.resourceName} not found, attempting to create`,
      );
      try {
        await admin.createSubscription(target.resourceName, subName);
        this.logger.log(
          `Created subscription ${subName} for ${target.resourceName}`,
        );
      } catch (err) {
        this.logger.warn(
          `Failed creating subscription ${subName} for ${target.resourceName}`,
          err as Error,
        );
      }
    }
  }

  private createReceiver(target: SubscriptionTarget): ServiceBusReceiver {
    if (target.isQueueMode) {
      return this.client.createReceiver(target.resourceName);
    }

    const finalSubscription =
      target.subscriptionName ?? target.defaultSubscriptionName;
    return this.client.createReceiver(target.resourceName, finalSubscription);
  }

  private subscribeReceiver(
    target: SubscriptionTarget,
    receiver: ServiceBusReceiver,
    onMessage: CapMessageHandler,
  ): void {
    receiver.subscribe(
      {
        processMessage: async (msg) => {
          try {
            await onMessage(
              msg.body,
              (msg.applicationProperties ?? {}) as CapHeaders,
            );
          } catch (err) {
            this.logger.warn(`Handler error for ${target.key}`, err as Error);
            throw err;
          }
        },
        processError: (args: ProcessErrorArgs) => {
          this.logger.error(
            `Error from ${target.key}: ${args.error?.message}`,
            args.error,
          );
          return Promise.resolve();
        },
      },
      {
        maxConcurrentCalls: target.maxConcurrentCalls,
      },
    );
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
