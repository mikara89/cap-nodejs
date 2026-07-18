'use strict';

const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const workflowFiles = Object.freeze({
  ci: path.join('.github', 'workflows', 'ci.yml'),
  release: path.join('.github', 'workflows', 'release.yml'),
});
const selectedActions = Object.freeze({
  checkout: 'actions/checkout@v7',
  setupNode: 'actions/setup-node@v7',
});

class WorkflowActionVerificationError extends Error {}

function scalar(value) {
  const trimmed = String(value).trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"')))
  )
    return trimmed.slice(1, -1);
  return trimmed;
}

function topLevelSection(source, name) {
  const lines = source.split(/\r?\n/u);
  const start = lines.findIndex((line) => line === `${name}:`);
  if (start < 0) return '';
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^[^\s#][^:]*:/u.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n');
}

// This is intentionally a focused reader for the repository's two workflow
// shapes, not a general YAML parser. It recognizes jobs, steps, and scalar
// `with` fields so policy checks are tied to structure instead of global text.
function parseSteps(jobSource) {
  const lines = jobSource.split(/\r?\n/u);
  const stepsStart = lines.findIndex((line) => /^    steps:\s*$/u.test(line));
  if (stepsStart < 0) return [];
  const steps = [];
  let current;
  for (const line of lines.slice(stepsStart + 1)) {
    const start = /^      -(?:\s+(.*))?$/u.exec(line);
    if (start) {
      if (current) steps.push(current);
      current = { lines: [line] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) steps.push(current);
  return steps.map((step, index) => {
    const raw = step.lines.join('\n');
    const name = /^(?:      - name:|        name:)\s*(.+)$/mu.exec(raw);
    const uses = /^(?:      - uses:|        uses:)\s*(\S+)\s*$/mu.exec(raw);
    const values = {};
    const withIndex = step.lines.findIndex((line) =>
      /^        with:\s*$/u.test(line),
    );
    if (withIndex >= 0) {
      for (const line of step.lines.slice(withIndex + 1)) {
        const field = /^          ([A-Za-z0-9_-]+):\s*(.*?)\s*$/u.exec(line);
        if (field) values[field[1]] = scalar(field[2]);
        else if (/^\s{0,8}\S/u.test(line)) break;
      }
    }
    return {
      index,
      name: name ? scalar(name[1]) : `step ${index + 1}`,
      uses: uses?.[1],
      with: values,
      raw,
    };
  });
}

function parseJobs(source) {
  const lines = source.split(/\r?\n/u);
  const jobsStart = lines.findIndex((line) => line === 'jobs:');
  if (jobsStart < 0) return new Map();
  const jobs = new Map();
  let current;
  for (const line of lines.slice(jobsStart + 1)) {
    const start = /^  ([A-Za-z0-9_-]+):\s*$/u.exec(line);
    if (start) {
      if (current) {
        current.raw = current.lines.join('\n');
        current.steps = parseSteps(current.raw);
        jobs.set(current.name, current);
      }
      current = { name: start[1], lines: [line] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) {
    current.raw = current.lines.join('\n');
    current.steps = parseSteps(current.raw);
    jobs.set(current.name, current);
  }
  return jobs;
}

function inspectWorkflow(name, source) {
  return {
    name,
    source,
    jobs: parseJobs(source),
    on: topLevelSection(source, 'on'),
    permissions: topLevelSection(source, 'permissions'),
  };
}

function actionSteps(workflow, prefix) {
  return [...workflow.jobs.values()].flatMap((job) =>
    job.steps
      .filter((step) => step.uses?.startsWith(`${prefix}@`))
      .map((step) => ({ ...step, job: job.name })),
  );
}

function singleActionStep(job, prefix, errors) {
  const steps = job?.steps.filter((step) =>
    step.uses?.startsWith(`${prefix}@`),
  );
  if (steps?.length === 1) return steps[0];
  errors.push(
    `${job?.name || 'missing job'} must contain exactly one ${prefix} step.`,
  );
  return undefined;
}

function verifyWorkflowSources(sources) {
  const errors = [];
  const check = (condition, message) => {
    if (!condition) errors.push(message);
  };
  const ci = inspectWorkflow('CI', sources.ci);
  const release = inspectWorkflow('Release', sources.release);
  const workflows = [ci, release];

  for (const workflow of workflows) {
    const checkoutSteps = actionSteps(workflow, 'actions/checkout');
    const setupSteps = actionSteps(workflow, 'actions/setup-node');
    check(checkoutSteps.length > 0, `${workflow.name} must use checkout.`);
    check(setupSteps.length > 0, `${workflow.name} must use setup-node.`);
    for (const step of checkoutSteps)
      check(
        step.uses === selectedActions.checkout,
        `${workflow.name} job ${step.job} must use ${selectedActions.checkout}; found ${step.uses}.`,
      );
    for (const step of setupSteps)
      check(
        step.uses === selectedActions.setupNode,
        `${workflow.name} job ${step.job} must use ${selectedActions.setupNode}; found ${step.uses}.`,
      );
  }

  const ciJobNames = [
    'build-and-test',
    'rabbitmq-integration',
    'kafka-integration',
    'aws-sns-sqs-integration',
    'servicebus-integration',
  ];
  for (const name of ciJobNames) {
    const job = ci.jobs.get(name);
    check(Boolean(job), `CI job ${name} must remain present.`);
    if (!job) continue;
    const checkout = singleActionStep(job, 'actions/checkout', errors);
    const setup = singleActionStep(job, 'actions/setup-node', errors);
    if (checkout)
      check(
        checkout.with['persist-credentials'] === 'false',
        `CI job ${name} checkout must set persist-credentials: false.`,
      );
    if (setup) {
      check(
        setup.with['node-version'] === '22',
        `CI job ${name} must keep node-version: 22.`,
      );
      check(
        setup.with.cache === 'npm',
        `CI job ${name} must keep npm caching.`,
      );
    }
  }
  for (const name of [
    'build-and-test',
    'rabbitmq-integration',
    'kafka-integration',
    'aws-sns-sqs-integration',
  ]) {
    const checkout = ci.jobs
      .get(name)
      ?.steps.find((step) => step.uses === selectedActions.checkout);
    check(
      checkout?.with['fetch-depth'] === '0',
      `CI job ${name} checkout must retain fetch-depth: 0.`,
    );
  }
  check(
    !/NPM_TOKEN|RELEASE_GITHUB_TOKEN/u.test(ci.source),
    'CI must not reference NPM_TOKEN or RELEASE_GITHUB_TOKEN.',
  );
  check(
    !/npm\s+publish|lerna\s+publish|release-tool\.js\s+execute/u.test(
      ci.source,
    ),
    'CI must not contain a publication command.',
  );

  const validate = release.jobs.get('validate');
  const publish = release.jobs.get('publish');
  check(Boolean(validate), 'Release validate job must remain present.');
  check(Boolean(publish), 'Release publish job must remain present.');
  const validateCheckout = singleActionStep(
    validate,
    'actions/checkout',
    errors,
  );
  const validateSetup = singleActionStep(
    validate,
    'actions/setup-node',
    errors,
  );
  const publishCheckout = singleActionStep(publish, 'actions/checkout', errors);
  const publishSetup = singleActionStep(publish, 'actions/setup-node', errors);

  if (validateCheckout) {
    check(
      validateCheckout.with['persist-credentials'] === 'false',
      'Release validate checkout must set persist-credentials: false.',
    );
    check(
      validateCheckout.with['fetch-depth'] === '0',
      'Release validate checkout must retain fetch-depth: 0.',
    );
    check(
      validateCheckout.with.token === undefined,
      'Release validate checkout must not use a custom token.',
    );
  }
  if (publishCheckout) {
    check(
      publishCheckout.with['persist-credentials'] === 'true',
      'Release publish checkout must set persist-credentials: true.',
    );
    check(
      publishCheckout.with['fetch-depth'] === '0',
      'Release publish checkout must retain fetch-depth: 0.',
    );
    check(
      publishCheckout.with.ref === '${{ needs.validate.outputs.head_sha }}',
      'Release publish checkout must select the immutable validated plan commit.',
    );
    check(
      publishCheckout.with.token === '${{ secrets.RELEASE_GITHUB_TOKEN }}',
      'Release publish checkout must retain RELEASE_GITHUB_TOKEN.',
    );
  }
  const attachApprovedMainSteps =
    publish?.steps.filter(
      (step) => step.name === 'Attach approved commit to local main',
    ) || [];
  check(
    attachApprovedMainSteps.length === 1,
    'Release publish must contain exactly one approved-main attachment step.',
  );
  const attachApprovedMain = attachApprovedMainSteps[0];
  if (attachApprovedMain) {
    const executeSteps =
      publish?.steps.filter((step) =>
        /release-tool\.js\s+execute\s+--plan/u.test(step.raw),
      ) || [];
    check(
      /^        if:\s*\$\{\{\s*inputs\.operation\s*!=\s*'recover'\s*\}\}\s*$/mu.test(
        attachApprovedMain.raw,
      ),
      'Release approved-main attachment must exclude recovery runs.',
    );
    check(
      /^          EXPECTED_HEAD_SHA:\s*\$\{\{\s*needs\.validate\.outputs\.head_sha\s*\}\}\s*$/mu.test(
        attachApprovedMain.raw,
      ) &&
        /^        run:\s*git switch --force-create main "\$\{EXPECTED_HEAD_SHA\}"\s*$/mu.test(
          attachApprovedMain.raw,
        ),
      'Release publish must attach local main to the immutable validated plan commit.',
    );
    check(
      Boolean(publishCheckout) &&
        publishCheckout.index < attachApprovedMain.index &&
        executeSteps.length > 0 &&
        executeSteps.every((step) => attachApprovedMain.index < step.index),
      'Release approved-main attachment must run after checkout and before execution.',
    );
  }
  for (const [name, setup] of [
    ['validate', validateSetup],
    ['publish', publishSetup],
  ]) {
    if (!setup) continue;
    check(
      setup.with['node-version'] === '22.19.0',
      `Release ${name} must keep node-version: 22.19.0.`,
    );
    check(setup.with.cache === 'npm', `Release ${name} must keep npm caching.`);
  }

  const releaseEvents = [...release.on.matchAll(/^  ([A-Za-z0-9_-]+):/gmu)].map(
    (match) => match[1],
  );
  check(
    releaseEvents.length === 1 && releaseEvents[0] === 'workflow_dispatch',
    'Release workflow must remain manual-only.',
  );
  check(
    /^  contents:\s*read\s*$/mu.test(release.permissions),
    'Release workflow default permissions must remain contents: read.',
  );
  check(
    !/^    permissions:/mu.test(validate?.raw || ''),
    'Release validate job must not override read-only workflow permissions.',
  );
  check(
    /^      contents:\s*write\s*$/mu.test(publish?.raw || '') &&
      /^      id-token:\s*write\s*$/mu.test(publish?.raw || ''),
    'Release publish permissions must retain contents: write and id-token: write.',
  );

  const upload = actionSteps(release, 'actions/upload-artifact');
  const download = actionSteps(release, 'actions/download-artifact');
  check(
    upload.length === 1 && upload[0].uses === 'actions/upload-artifact@v4',
    'Release must retain one actions/upload-artifact@v4 step.',
  );
  check(
    download.length === 1 &&
      download[0].uses === 'actions/download-artifact@v4',
    'Release must retain one actions/download-artifact@v4 step.',
  );
  check(
    upload[0]?.with.name === 'lerna-release-plan' &&
      download[0]?.with.name === 'lerna-release-plan',
    'Release artifact transfer must retain the lerna-release-plan name.',
  );

  if (errors.length > 0)
    throw new WorkflowActionVerificationError(
      `Workflow action verification failed:\n- ${errors.join('\n- ')}`,
    );

  return {
    actions: selectedActions,
    ci: {
      jobs: ciJobNames,
      checkoutCount: actionSteps(ci, 'actions/checkout').length,
      setupNodeCount: actionSteps(ci, 'actions/setup-node').length,
    },
    release: {
      jobs: ['validate', 'publish'],
      checkoutCount: actionSteps(release, 'actions/checkout').length,
      setupNodeCount: actionSteps(release, 'actions/setup-node').length,
    },
  };
}

function verifyWorkflowActions(options = {}) {
  const cwd = path.resolve(options.cwd || rootDir);
  return verifyWorkflowSources({
    ci: fs.readFileSync(path.join(cwd, workflowFiles.ci), 'utf8'),
    release: fs.readFileSync(path.join(cwd, workflowFiles.release), 'utf8'),
  });
}

module.exports = {
  WorkflowActionVerificationError,
  inspectWorkflow,
  selectedActions,
  verifyWorkflowActions,
  verifyWorkflowSources,
  workflowFiles,
};

if (require.main === module) {
  try {
    const result = verifyWorkflowActions();
    console.log(
      `Verified ${result.ci.checkoutCount + result.release.checkoutCount} checkout and ${result.ci.setupNodeCount + result.release.setupNodeCount} setup-node steps.`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
