import { HarnessLifecyclePlugin } from '../plugin-modules/harness-lifecycle.js';
import { HarnessRoleModelRoutingEnforcementPlugin } from '../plugin-modules/role-model-routing-enforcement.js';

export default async function HarnessPlugin(context) {
  return {
    ...(await HarnessLifecyclePlugin(context)),
    ...(await HarnessRoleModelRoutingEnforcementPlugin(context)),
  };
}
