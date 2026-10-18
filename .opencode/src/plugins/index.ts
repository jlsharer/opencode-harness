import { HarnessLifecyclePlugin } from "../plugin-modules/harness-lifecycle.ts";
import type { HarnessPluginContext } from "../plugin-modules/harness-lifecycle.ts";
import { HarnessRoleModelRoutingEnforcementPlugin } from "../plugin-modules/role-model-routing-enforcement.ts";
import { TraceRootPermissionsPlugin } from "../plugin-modules/trace-root-permissions.ts";

export default async function HarnessPlugin(context: HarnessPluginContext) {
  const lifecycle = await HarnessLifecyclePlugin(context);
  const routing = await HarnessRoleModelRoutingEnforcementPlugin(context);
  const tracePermissions = await TraceRootPermissionsPlugin(context);
  return {
    ...lifecycle,
    ...routing,
    ...tracePermissions,
    config: async (cfg: unknown) => {
      await routing.config?.(cfg);
      await tracePermissions.config?.(cfg);
    },
  };
}
