import { validateGlobalHarness } from "../src/scripts/validate-global-harness.ts";

export { validateGlobalHarness };
if (process.argv[1]?.endsWith("validate-global-harness.mts"))
  console.log(JSON.stringify(validateGlobalHarness()));
