import { render } from "ink";
import React from "react";
import { App } from "../tui/App.js";
import type { Runner } from "../core/runner.js";
import type { RequestPermission } from "../permissions.js";

interface TUIOptions {
  runner: Runner;
  model: string;
  providerName: string;
  setPermissionCallback?: (cb: RequestPermission) => void;
}

export async function startTUI(opts: TUIOptions): Promise<void> {
  const { waitUntilExit } = render(
    React.createElement(App, {
      runner: opts.runner,
      model: opts.model,
      providerName: opts.providerName,
      setPermissionCallback: opts.setPermissionCallback,
    })
  );
  await waitUntilExit();
}
