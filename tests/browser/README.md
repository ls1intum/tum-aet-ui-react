# Browser interaction tests

Run the jsdom suite with `pnpm test`. Native browser interactions use a separate Vitest configuration. `test:browser` builds the package first, and browser fixtures import the built public entry and setup loads `dist/styles.css`:

```sh
pnpm install --frozen-lockfile
pnpm test:browser:install
pnpm test:browser
pnpm test:browser --project firefox
```

The install command downloads Chromium, Firefox and WebKit and installs their Linux system dependencies. On macOS, use `pnpm exec playwright install chromium firefox webkit` to download the browsers.

## macOS keyboard navigation

Playwright WebKit respects the macOS keyboard-navigation preference. Without it, Tab skips buttons; see the [upstream explanation](https://github.com/microsoft/playwright/issues/41808). Record the existing app-specific value before enabling it:

```sh
defaults read org.webkit.Playwright AppleKeyboardUIMode
defaults write org.webkit.Playwright AppleKeyboardUIMode -int 2
```

Restore the recorded value afterwards, or delete the override with `defaults delete org.webkit.Playwright AppleKeyboardUIMode` if it was absent. Ubuntu CI needs no override.

## Maintaining tests

[Vitest Browser Mode](https://vitest.dev/guide/browser/) uses its [Playwright provider](https://vitest.dev/config/browser/playwright) and the existing Testing Library React renderer. Keep Vitest and its browser provider versions aligned; the provider declares an exact Vitest peer.

Fixtures stay outside `src` and published output. Setup preserves native dialog, focus, layout and scroll APIs and cleans up React after each test. Use native interactions and observable roles/state; geometry assertions poll actual rectangles rather than mocking layout.

Browser fixtures import `@tumaet/ui-react`; Vite resolves it to `dist/index.js`, while the browser TypeScript project checks the source public API. Release validation supplies `dist` from the verified tarball and invokes Vitest directly so those bytes are preserved.

Run `pnpm test:storybook` to execute the published examples and their interaction/accessibility checks in both themes using Chromium.

Use unit tests for AET composition, labels, translations, callback/ref forwarding and owned state or promise lifetimes. Use real browsers for native focus, keyboard/pointer interaction, forms, positioning and emitted CSS; avoid repeating the same workflow in jsdom. Await the relevant state or promise instead of flushing an arbitrary timer.

Vitest runs tests in an iframe. Establish initial keyboard focus inside it. Exercise keyboard containment separately from Escape dismissal and focus return. Test Tab and Shift+Tab at the dialog’s last and first controls, respectively, and assert the opposite boundary receives focus. Require a particular initial target only when the caller requested it.

## Failure artifacts

CI uploads `build/browser-results/`. Each engine has its own screenshot/attachment directory; failure trace filenames also include the engine. Open a trace with:

```sh
pnpm exec playwright show-trace <downloaded-file.trace.zip>
```

Local artifacts accumulate. Remove `build/browser-results/` before a run when a fresh result set is needed. These tests cover representative interaction contracts; they do not certify visual or screen-reader behaviour.
