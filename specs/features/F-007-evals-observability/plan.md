# F-007 Plan

1. **Tracing** (done): instrumentation in each agent. Covers R1.
2. **Datasets and judge pipeline** (done). Covers R2-R4, R6.
3. **Parameterize the pipeline** (planned, fixes G1): experiment name, dataset and space as arguments or variables.
4. **Grow the datasets** (planned, fixes G3): add failed manual bids, unauthorized users, sold trades; keep categories from R2.
5. **Regression gate** (planned, fixes G2)
   1. Define a minimum score per category.
   2. Run the pipeline from a manual-dispatch workflow (it costs tokens) and report scores in the PR.
6. **Cover every agent** (planned, fixes G4): one command that runs the same dataset on each of the three agents.
7. **Eval new surfaces** (planned): voice (F-008) and TypeScript-backed tools (F-006 task 5).
