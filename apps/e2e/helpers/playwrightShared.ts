import { devices, type PlaywrightTestConfig } from '@playwright/test';

/** Failure artifacts. Trace stays on first retry so local green runs stay quiet. */
export const diagnosticsUse: PlaywrightTestConfig['use'] = {
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
};

/**
 * Mobile + touch projects.
 * `webkit-mobile` uses Playwright's iPhone 13 descriptor (WebKit engine).
 * That is not a real iPhone, not iOS Safari, and not a Home Screen install.
 * @smoke runs on both; @functional stays on Chromium unless `webkitSmokeOnly` is false.
 */
export function mobileProjects(webkitSmokeOnly = true) {
  return [
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
    {
      name: 'webkit-mobile',
      use: { ...devices['iPhone 13'] },
      ...(webkitSmokeOnly ? { grep: /@smoke/ } : {}),
    },
  ];
}

export const ciReporter: PlaywrightTestConfig['reporter'] = process.env.CI
  ? [
      ['list'],
      ['html', { open: 'never' }],
    ]
  : [['list']];
