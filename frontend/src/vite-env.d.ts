/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LFM_BASE_URL: string;
  readonly VITE_LFM_MODEL_NAME: string;
  readonly VITE_SIGNALPH_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}