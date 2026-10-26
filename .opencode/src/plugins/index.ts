import { HarnessLifecyclePlugin } from "../plugin-modules/harness-lifecycle.ts";
import type { HarnessPluginContext } from "../plugin-modules/harness-lifecycle.ts";
import {
  HarnessRoleModelRoutingEnforcementPlugin,
  guardConfiguredDispatch,
} from "../plugin-modules/role-model-routing-enforcement.ts";
import { TraceRootPermissionsPlugin } from "../plugin-modules/trace-root-permissions.ts";

export async function HarnessPlugin(context: HarnessPluginContext) {
  const lifecycle = await HarnessLifecyclePlugin(context);
  const routing = await HarnessRoleModelRoutingEnforcementPlugin(context);
  const tracePermissions = await TraceRootPermissionsPlugin(context);
  return {
    ...lifecycle,
    ...routing,
    ...tracePermissions,
    tool: lifecycle.tool,
    ...guardConfiguredDispatch(lifecycle, async (cfg) => {
      await routing.config(cfg);
      await tracePermissions.config(cfg);
      await lifecycle.config(cfg);
    }),
  };
}

export default process.env.OPENCODE_HARNESS_NATIVE_API === "v2"
  ? (await import("../plugin-modules/v2-native-plugin.js")).V2NativePlugin
  : HarnessPlugin;
