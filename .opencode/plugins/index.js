import { HarnessLifecyclePlugin } from "../plugin-modules/harness-lifecycle.js";
import { HarnessRoleModelRoutingEnforcementPlugin, guardConfiguredDispatch, } from "../plugin-modules/role-model-routing-enforcement.js";
import { TraceRootPermissionsPlugin } from "../plugin-modules/trace-root-permissions.js";
export async function HarnessPlugin(context) {
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
