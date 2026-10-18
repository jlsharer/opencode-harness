import { HarnessLifecyclePlugin } from "../plugin-modules/harness-lifecycle.js";
import { HarnessRoleModelRoutingEnforcementPlugin, guardConfiguredDispatch, } from "../plugin-modules/role-model-routing-enforcement.js";
import { TraceRootPermissionsPlugin } from "../plugin-modules/trace-root-permissions.js";
export default async function HarnessPlugin(context) {
    const lifecycle = await HarnessLifecyclePlugin(context);
    const routing = await HarnessRoleModelRoutingEnforcementPlugin(context);
    const tracePermissions = await TraceRootPermissionsPlugin(context);
    return {
        ...lifecycle,
        ...routing,
        ...tracePermissions,
        ...guardConfiguredDispatch(lifecycle, async (cfg) => {
            await routing.config(cfg);
            await tracePermissions.config(cfg);
        }),
    };
}
