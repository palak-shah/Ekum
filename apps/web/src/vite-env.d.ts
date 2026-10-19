/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEB_BUILD?: string;
  readonly VITE_EKUM_VERSION?: string;
  readonly VITE_EKUM_BUILD_ID?: string;
  readonly VITE_EKUM_GIT_SHA?: string;
  readonly VITE_EKUM_BUILT_AT?: string;
  readonly VITE_EKUM_DEPLOYMENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
