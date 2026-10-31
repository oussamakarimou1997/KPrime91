/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_PASSCODE?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
