'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  WorkflowActionVerificationError,
  inspectWorkflow,
  selectedActions,
  verifyWorkflowActions,
  verifyWorkflowSources,
} = require('./verify-workflow-actions');

const repositoryRoot = path.resolve(__dirname, '..');
const sources = Object.freeze({
  ci: fs.readFileSync(
    path.join(repositoryRoot, '.github', 'workflows', 'ci.yml'),
    'utf8',
  ),
  release: fs.readFileSync(
    path.join(repositoryRoot, '.github', 'workflows', 'release.yml'),
    'utf8',
  ),
});

function replaceRequired(source, search, replacement) {
  assert.ok(source.includes(search), `Expected fixture text: ${search}`);
  return source.replace(search, replacement);
}

function mutateJob(source, name, mutation) {
  const start = source.indexOf(`  ${name}:`);
  assert.notEqual(start, -1, `Expected workflow job ${name}`);
  const remainder = source.slice(start + 1);
  const next = /\n  [A-Za-z0-9_-]+:\s*\n/u.exec(remainder);
  const end = next ? start + 1 + next.index : source.length;
  return `${source.slice(0, start)}${mutation(source.slice(start, end))}${source.slice(end)}`;
}

function expectFailure(changes, pattern) {
  assert.throws(
    () => verifyWorkflowSources({ ...sources, ...changes }),
    (error) =>
      error instanceof WorkflowActionVerificationError &&
      pattern.test(error.message),
  );
}

test('repository workflows satisfy the action runtime and credential policy', () => {
  const result = verifyWorkflowActions({ cwd: repositoryRoot });
  assert.deepEqual(result.actions, selectedActions);
  assert.equal(result.ci.checkoutCount, 5);
  assert.equal(result.ci.setupNodeCount, 5);
  assert.equal(result.release.checkoutCount, 2);
  assert.equal(result.release.setupNodeCount, 2);

  const ci = inspectWorkflow('CI', sources.ci);
  for (const job of ci.jobs.values()) {
    const checkout = job.steps.find(
      (step) => step.uses === selectedActions.checkout,
    );
    const setup = job.steps.find(
      (step) => step.uses === selectedActions.setupNode,
    );
    assert.ok(checkout, `${job.name} checkout`);
    assert.equal(checkout.with['persist-credentials'], 'false');
    assert.ok(setup, `${job.name} setup-node`);
    assert.equal(setup.with['node-version'], '22');
    assert.equal(setup.with.cache, 'npm');
  }

  const release = inspectWorkflow('Release', sources.release);
  const validateCheckout = release.jobs
    .get('validate')
    .steps.find((step) => step.uses === selectedActions.checkout);
  const publishCheckout = release.jobs
    .get('publish')
    .steps.find((step) => step.uses === selectedActions.checkout);
  assert.equal(validateCheckout.with['persist-credentials'], 'false');
  assert.equal(publishCheckout.with['persist-credentials'], 'true');
  assert.equal(
    publishCheckout.with.token,
    '${{ secrets.RELEASE_GITHUB_TOKEN }}',
  );
});

test('workflow verifier rejects version, runtime, and cache regressions', async (t) => {
  await t.test('1 CI checkout v4', () => {
    expectFailure(
      {
        ci: replaceRequired(
          sources.ci,
          'actions/checkout@v7',
          'actions/checkout@v4',
        ),
      },
      /must use actions\/checkout@v7/u,
    );
  });
  await t.test('2 CI setup-node v4', () => {
    expectFailure(
      {
        ci: replaceRequired(
          sources.ci,
          'actions/setup-node@v7',
          'actions/setup-node@v4',
        ),
      },
      /must use actions\/setup-node@v7/u,
    );
  });
  await t.test('3 release checkout v4', () => {
    expectFailure(
      {
        release: replaceRequired(
          sources.release,
          'actions/checkout@v7',
          'actions/checkout@v4',
        ),
      },
      /must use actions\/checkout@v7/u,
    );
  });
  await t.test('4 release setup-node v4', () => {
    expectFailure(
      {
        release: replaceRequired(
          sources.release,
          'actions/setup-node@v7',
          'actions/setup-node@v4',
        ),
      },
      /must use actions\/setup-node@v7/u,
    );
  });
  await t.test('5 inconsistent action major in an optional job', () => {
    const ci = mutateJob(sources.ci, 'kafka-integration', (job) =>
      replaceRequired(job, 'actions/checkout@v7', 'actions/checkout@v6'),
    );
    expectFailure({ ci }, /kafka-integration must use actions\/checkout@v7/u);
  });
  await t.test('6 CAP CI runtime changed from Node.js 22', () => {
    const ci = mutateJob(sources.ci, 'build-and-test', (job) =>
      replaceRequired(job, 'node-version: 22', 'node-version: 24'),
    );
    expectFailure({ ci }, /build-and-test must keep node-version: 22/u);
  });
  await t.test('7 release runtime patch changed', () => {
    const release = mutateJob(sources.release, 'validate', (job) =>
      replaceRequired(job, 'node-version: 22.19.0', 'node-version: 24'),
    );
    expectFailure({ release }, /validate must keep node-version: 22\.19\.0/u);
  });
  await t.test('8 npm caching removed', () => {
    const ci = mutateJob(sources.ci, 'servicebus-integration', (job) =>
      replaceRequired(job, "cache: 'npm'", "cache: 'none'"),
    );
    expectFailure({ ci }, /servicebus-integration must keep npm caching/u);
  });
  await t.test('9 required full history removed', () => {
    const ci = mutateJob(sources.ci, 'rabbitmq-integration', (job) =>
      replaceRequired(job, 'fetch-depth: 0', 'fetch-depth: 1'),
    );
    expectFailure(
      { ci },
      /rabbitmq-integration checkout must retain fetch-depth: 0/u,
    );
  });
});

test('workflow verifier rejects credential and release-safety regressions', async (t) => {
  await t.test('10 read-only primary CI checkout persists credentials', () => {
    const ci = mutateJob(sources.ci, 'build-and-test', (job) =>
      replaceRequired(
        job,
        'persist-credentials: false',
        'persist-credentials: true',
      ),
    );
    expectFailure(
      { ci },
      /build-and-test checkout must set persist-credentials: false/u,
    );
  });
  for (const [number, name] of [
    [11, 'rabbitmq-integration'],
    [12, 'kafka-integration'],
    [13, 'aws-sns-sqs-integration'],
    [14, 'servicebus-integration'],
  ]) {
    await t.test(
      `${number} read-only ${name} checkout persists credentials`,
      () => {
        const ci = mutateJob(sources.ci, name, (job) =>
          replaceRequired(
            job,
            'persist-credentials: false',
            'persist-credentials: true',
          ),
        );
        expectFailure(
          { ci },
          new RegExp(
            `${name} checkout must set persist-credentials: false`,
            'u',
          ),
        );
      },
    );
  }
  await t.test('15 release validation persists credentials', () => {
    const release = mutateJob(sources.release, 'validate', (job) =>
      replaceRequired(
        job,
        'persist-credentials: false',
        'persist-credentials: true',
      ),
    );
    expectFailure(
      { release },
      /validate checkout must set persist-credentials: false/u,
    );
  });
  await t.test('16 release publication drops credentials', () => {
    const release = mutateJob(sources.release, 'publish', (job) =>
      replaceRequired(
        job,
        'persist-credentials: true',
        'persist-credentials: false',
      ),
    );
    expectFailure(
      { release },
      /publish checkout must set persist-credentials: true/u,
    );
  });
  await t.test('17 release publication changes its token', () => {
    const release = mutateJob(sources.release, 'publish', (job) =>
      replaceRequired(
        job,
        'secrets.RELEASE_GITHUB_TOKEN',
        'secrets.GITHUB_TOKEN',
      ),
    );
    expectFailure(
      { release },
      /publish checkout must retain RELEASE_GITHUB_TOKEN/u,
    );
  });
  await t.test(
    '17b release publication stops using the validated commit',
    () => {
      const release = mutateJob(sources.release, 'publish', (job) =>
        replaceRequired(job, '${{ needs.validate.outputs.head_sha }}', 'main'),
      );
      expectFailure(
        { release },
        /publish checkout must select the immutable validated plan commit/u,
      );
    },
  );
  await t.test('18 CI references a release secret', () => {
    expectFailure(
      { ci: `${sources.ci}\n# \${{ secrets.RELEASE_GITHUB_TOKEN }}\n` },
      /CI must not reference NPM_TOKEN or RELEASE_GITHUB_TOKEN/u,
    );
  });
  await t.test('19 CI references an npm publication secret', () => {
    expectFailure(
      { ci: `${sources.ci}\n# \${{ secrets.NPM_TOKEN }}\n` },
      /CI must not reference NPM_TOKEN or RELEASE_GITHUB_TOKEN/u,
    );
  });
  await t.test('20 CI gains a publication command', () => {
    expectFailure(
      { ci: `${sources.ci}\n# npm publish\n` },
      /CI must not contain a publication command/u,
    );
  });
  await t.test('21 release gains a non-manual trigger', () => {
    const release = replaceRequired(
      sources.release,
      '  workflow_dispatch:',
      '  push:\n    branches: [main]\n  workflow_dispatch:',
    );
    expectFailure({ release }, /Release workflow must remain manual-only/u);
  });
  await t.test('22 release publish permissions are weakened', () => {
    const release = mutateJob(sources.release, 'publish', (job) =>
      replaceRequired(job, 'id-token: write', 'id-token: read'),
    );
    expectFailure({ release }, /contents: write and id-token: write/u);
  });
  await t.test('23 release validation overrides read-only permissions', () => {
    const release = mutateJob(sources.release, 'validate', (job) =>
      replaceRequired(
        job,
        '    runs-on: ubuntu-latest',
        '    runs-on: ubuntu-latest\n    permissions:\n      contents: write',
      ),
    );
    expectFailure({ release }, /validate job must not override read-only/u);
  });
  await t.test('24 release artifact transfer changes unexpectedly', () => {
    const release = replaceRequired(
      sources.release,
      'actions/upload-artifact@v4',
      'actions/upload-artifact@v5',
    );
    expectFailure({ release }, /retain one actions\/upload-artifact@v4/u);
  });
});
