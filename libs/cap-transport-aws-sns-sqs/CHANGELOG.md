# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.1.0](https://github.com/mikara89/cap-nodejs/compare/@mikara89/cap-transport-aws-sns-sqs@0.0.0...@mikara89/cap-transport-aws-sns-sqs@0.1.0) (2026-07-19)

### Features

- **transports:** prepare first independent releases ([#11](https://github.com/mikara89/cap-nodejs/issues/11)) ([cf2c675](https://github.com/mikara89/cap-nodejs/commit/cf2c6752aae76efc01e277c058e76aea13896393))

### Bug Fixes

- **aws-sns-sqs:** preserve queue policy and drain shutdown ([#12](https://github.com/mikara89/cap-nodejs/issues/12)) ([15743f1](https://github.com/mikara89/cap-nodejs/commit/15743f11191374ea2cfbea5ed916e4f4391e64e3))

# Changelog

## 0.0.0

- Initial unreleased AWS SNS/SQS transport baseline.
- JSON publishing to SNS topics with CAP message attributes.
- SQS long-polling consumer with configurable batch size, wait time, and visibility timeout.
- Success-only message deletion; handler failures preserve messages for redelivery.
- Malformed-message deletion to prevent poison-message loops.
- Optional auto-provisioning of SNS topics, SQS queues, and SNS→SQS subscriptions.
- Graceful start/stop and cleanup lifecycle.
