# F-004 Validation

Mergeable when the checks for every requirement you touched pass, and the global checks pass.

## Global
- `make validate-all` in `trade-backend/` passes.
- `scripts/smoke.sh <base-url>` passes (15 checks) on each target you touched: local `:8080`, Kubernetes `:8081`, the API Gateway `/prod` URL, the APIM URL.
- Validation commands create no cloud resources; deploys are a separate manual step.

## Per requirement
| Requirement | How it is checked |
|---|---|
| R1 | Code review: nothing under `src/core` imports an adapter or cloud SDK; edit one constant, rerun the suite, and every target changes together |
| R2 | `tests/openapi.test.ts`; VTL test; smoke on two or more targets returns identical shapes |
| R3 | `make run-local`, then `make smoke` |
| R4 | `make validate-k8s`, then `make k8s-build k8s-apply k8s-forward` and smoke on :8081; the pod restarts and data remains |
| R5 | `cdk synth`; the VTL template test; smoke against the deployed `/prod` URL |
| R6 | `make validate-azure`; `terraform plan` shows no unexpected changes; smoke against the APIM URL |
| R7 | `publish-function.sh` ends with a successful deployment and smoke passes without a Terraform change |
| R8 | `bun test` repository contract on in-memory and SQLite; Cosmos with the emulator |
| R9 | The script exits non-zero when one check is made to fail |
| R10 | `make validate-all` |

## Open (until the gap tasks are done)
- G1: a list larger than one page returns each item exactly once.
- G2: a pull request runs `validate-all` automatically.
