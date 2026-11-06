# F-004 Plan

1. **Core extraction** (done): pure rules, ports, in-memory fakes. Covers R1.
2. **Local and Kubernetes** (done): Hono server, Drizzle/SQLite, Dockerfile, manifests, `make k8s-*`. Covers R3, R4.
3. **AWS alignment** (done): VTL response templates, Lambda handlers on the core, UI on plain JSON. Covers R2, R5.
4. **Azure** (done): Cosmos adapter, Hono-on-Functions adapter, Terraform, `publish-function.sh`. Covers R6, R7.
5. **Handoff** (done): `scripts/smoke.sh`, `make validate-*`, deploy README. Covers R9, R10.
6. **Page the list routes** (planned, fixes G1): shared with F-002 task 3.
7. **CI for the targets** (planned, fixes G2)
   1. A workflow that runs `make validate-all` on PRs.
   2. Optional manual-dispatch deploy workflows for AWS and Azure.
8. **Cleanup** (planned, fixes G3): refresh `deploy/aws-cdk/README.md`; commit `.terraform.lock.hcl`.
