import { HarnessLifecyclePlugin } from '../plugin-modules/harness-lifecycle.js';

export default async function HarnessPlugin(context) {
  return HarnessLifecyclePlugin(context);
}
