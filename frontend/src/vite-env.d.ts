/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_BASE_DOMAIN?: string;
  readonly VITE_SAAS_DOMAIN?: string;
  readonly VITE_ADMIN_EMAILS?: string; // Emails permitidos para admin master (separados por vírgula)
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


