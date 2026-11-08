# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private reporting instead:
**Security tab → Report a vulnerability** on this repository.

If you cannot use that, email 560w0mel@anonaddy.com. This is a forwarding address, and I can reply to it without
revealing my own inbox.

This is a personal, educational project with a single maintainer. I will try to answer within 7 days and tell you
what I plan to do. I cannot promise fix dates.

## Supported versions

There are no releases. Only the latest commit on `main` is supported.

## Scope

In scope: the code in this repository, such as the API, the backends, the UIs, the AI agents and the deployment
templates (CDK, Terraform, Kubernetes).

Out of scope: instances that someone else deployed, the sample data, and the third-party services this project
uses (AWS, Azure, Databricks, Arize, Bedrock).

## Leaked secrets

If you find an API key, token or personal data committed to this repository, report it privately, as above, and do
not copy it into an issue or a PR. Env files are git-ignored and a secret scan runs on every push, but a report is
welcome if something slipped through.
