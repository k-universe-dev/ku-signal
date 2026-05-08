import { render } from "ink";
import React from "react";
import { App } from "../tui/App.js";
import type { Runner } from "../core/runner.js";

interface TUIOptions {
  runner: Runner;
  model: string;
  providerName: string;
}

export async function startTUI(opts: TUIOptions): Promise<void> {
  const { waitUntilExit } = render(
    React.createElement(App, {
      runner: opts.runner,
      model: opts.model,
      providerName: opts.providerName,
    })
  );
  await waitUntilExit();
}
