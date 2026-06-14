import { Test } from '@nestjs/testing';
import {
  ServiceBusAdministrationClient,
  ServiceBusClient,
} from '@azure/service-bus';
import { ServiceBusTransportModule } from '@mikara89/azure-servicebus-transport';
import {
  PUBLISHER,
  SUBSCRIBER,
  type IPublisher,
  type ISubscriber,
} from '@mikara89/cap-nest';
import { v4 as uuid } from 'uuid';

describe('Integration: transport-azure-servicebus', () => {
  it('publishes and receives a message when SERVICEBUS_CONNECTION_STRING is provided or emulator is available', async () => {
    const providedConn = process.env.SERVICEBUS_CONNECTION_STRING;
    let conn = providedConn;
    // If no connection string provided, try to start the Microsoft Service Bus emulator
    // using Testcontainers. This mirrors the docker-compose snippet:
    // - mcr.microsoft.com/azure-messaging/servicebus-emulator:latest
    // - mcr.microsoft.com/azure-sql-edge:latest
    let network: any = null;
    let emulatorContainer: any = null;
    let sqlEdgeContainer: any = null;

    async function startServiceBusEmulator(): Promise<{
      conn?: string;
      network?: any;
      emulatorContainer?: any;
      sqlEdgeContainer?: any;
    }> {
      // load dynamically to avoid static typing mismatches
      // use dynamic import (allowed in async function)
      let tc: any;
      try {
        tc = await import('testcontainers');
      } catch {
        throw new Error('testcontainers not available');
      }

      let networkLocal: any = null;
      // try multiple Network APIs depending on testcontainers version
      if (tc.Network) {
        try {
          if (typeof tc.Network.start === 'function') {
            networkLocal = await tc.Network.start();
          } else if (typeof tc.Network === 'function') {
            // class style: new Network().start()
            networkLocal = await new tc.Network().start();
          }
        } catch {
          // ignore and continue without network
          networkLocal = null;
        }
      }

      const ACCEPT_EULA = process.env.ACCEPT_EULA ?? 'Y';
      const MSSQL_SA_PASSWORD = process.env.MSSQL_SA_PASSWORD ?? 'P@ssw0rd!';

      let sqlC: any = null;
      let emuC: any = null;
      try {
        const sqlBuilder = new tc.GenericContainer(
          'mcr.microsoft.com/azure-sql-edge:latest',
        )
          .withEnv('ACCEPT_EULA', ACCEPT_EULA)
          .withEnv('MSSQL_SA_PASSWORD', MSSQL_SA_PASSWORD);
        if (networkLocal && typeof sqlBuilder.withNetwork === 'function') {
          sqlBuilder.withNetwork(networkLocal);
          if (typeof sqlBuilder.withNetworkAliases === 'function')
            sqlBuilder.withNetworkAliases('sqledge');
        }
        sqlC = await sqlBuilder.start();

        const emuBuilder = new tc.GenericContainer(
          'mcr.microsoft.com/azure-messaging/servicebus-emulator:latest',
        )
          .withEnv('SQL_SERVER', 'sqledge')
          .withEnv('MSSQL_SA_PASSWORD', MSSQL_SA_PASSWORD)
          .withEnv('ACCEPT_EULA', ACCEPT_EULA)
          .withExposedPorts(5672);
        if (networkLocal && typeof emuBuilder.withNetwork === 'function') {
          emuBuilder.withNetwork(networkLocal);
          if (typeof emuBuilder.withNetworkAliases === 'function')
            emuBuilder.withNetworkAliases('sb-emulator');
        }
        emuC = await emuBuilder.start();

        const host = emuC.getHost();
        const port = emuC.getMappedPort(5672);
        const connStr = `Endpoint=sb://${host}:${port}/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=secret`;

        return {
          conn: connStr,
          network: networkLocal,
          emulatorContainer: emuC,
          sqlEdgeContainer: sqlC,
        };
      } catch (err) {
        // cleanup partials
        try {
          if (emuC) await emuC.stop().catch(() => {});
        } catch {
          void 0;
        }
        try {
          if (sqlC) await sqlC.stop().catch(() => {});
        } catch {
          void 0;
        }
        try {
          if (networkLocal && typeof networkLocal.stop === 'function')
            await networkLocal.stop().catch(() => {});
        } catch {
          void 0;
        }
        throw err;
      }
    }

    if (!conn) {
      try {
        const started = await startServiceBusEmulator();
        conn = started.conn;
        network = started.network ?? null;
        emulatorContainer = started.emulatorContainer ?? null;
        sqlEdgeContainer = started.sqlEdgeContainer ?? null;
      } catch (_err) {
        if (process.env.CAP_SERVICEBUS_INTEGRATION_REQUIRED === 'true') {
          throw _err;
        }

        console.warn(
          'Service Bus emulator startup failed, skipping test:',
          _err?.message ?? _err,
        );
        // ensure any partial started resources are stopped
        if (emulatorContainer) await emulatorContainer.stop().catch(() => {});
        if (sqlEdgeContainer) await sqlEdgeContainer.stop().catch(() => {});
        if (network) {
          try {
            if (typeof network.stop === 'function')
              await network.stop().catch(() => {});
            else if (typeof network.close === 'function')
              await network.close().catch(() => {});
          } catch {
            void 0;
          }
        }
        return;
      }
    }

    const topicPrefix = `cap-test-${uuid().slice(0, 6)}-`;
    const subscriptionPrefix = `sub-test-${uuid().slice(0, 6)}-`;

    const topic = `topic-${uuid().slice(0, 8)}`;
    const group = `group-${uuid().slice(0, 8)}`;

    const topicName = topicPrefix + topic;
    const subscriptionName = subscriptionPrefix + group;

    const admin = new ServiceBusAdministrationClient(conn as string);
    // create topic and subscription if not exists
    try {
      const exists = await admin
        .getTopic(topicName)
        .then(() => true)
        .catch(() => false);
      if (!exists) await admin.createTopic(topicName);
    } catch {
      void 0;
    }

    try {
      const existsSub = await admin
        .getSubscription(topicName, subscriptionName)
        .then(() => true)
        .catch(() => false);
      if (!existsSub)
        await admin.createSubscription(topicName, subscriptionName);
    } catch {
      void 0;
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        ServiceBusTransportModule.forRoot({
          connectionString: conn as string,
          topicPrefix,
          subscriptionPrefix,
        }),
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const publisher = moduleRef.get<IPublisher>(PUBLISHER);
    const subscriber = moduleRef.get<ISubscriber>(SUBSCRIBER);

    let received: unknown = null;
    let receivedHeaders: unknown = null;
    const receivedPromise = new Promise<unknown>((resolve) => {
      void subscriber.consume(topic, group, async (payload, headers) => {
        received = payload;
        receivedHeaders = headers;
        resolve(payload);
        // include await so lint rule `require-await` is satisfied
        await Promise.resolve();
      });
    });

    const payload = { hello: 'service-bus', ts: Date.now() };
    const headers = { traceId: `trace-${uuid().slice(0, 8)}` };
    await publisher.emit(topic, payload, headers);

    const result = await Promise.race([
      receivedPromise,
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error('timeout waiting for message')), 15000),
      ),
    ]);

    expect(result).toBeTruthy();
    expect(received).toMatchObject(payload);
    expect(receivedHeaders).toMatchObject(headers);

    // cleanup
    await app.close();
    // also try to close the underlying ServiceBusClient if present
    try {
      const client = moduleRef.get(ServiceBusClient as any);
      if (client && typeof client.close === 'function') await client.close();
    } catch {
      void 0;
    }

    // stop emulator containers if we started them
    if (!providedConn) {
      try {
        if (emulatorContainer) await emulatorContainer.stop();
      } catch {
        void 0;
      }
      try {
        if (sqlEdgeContainer) await sqlEdgeContainer.stop();
      } catch {
        void 0;
      }
      try {
        if (network)
          await (network.stop ? network.stop() : network).catch?.(() => {});
      } catch {
        void 0;
      }
    }
  });
});
