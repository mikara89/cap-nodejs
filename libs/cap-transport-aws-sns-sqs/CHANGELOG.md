# Changelog

## 0.0.0

- Initial unreleased AWS SNS/SQS transport baseline.
- JSON publishing to SNS topics with CAP message attributes.
- SQS long-polling consumer with configurable batch size, wait time, and visibility timeout.
- Success-only message deletion; handler failures preserve messages for redelivery.
- Malformed-message deletion to prevent poison-message loops.
- Optional auto-provisioning of SNS topics, SQS queues, and SNS→SQS subscriptions.
- Graceful start/stop and cleanup lifecycle.
