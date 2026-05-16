import { contextBridge, ipcRenderer } from "electron";

export interface DesktopBridge {
  setApiKey: (provider: string, value: string) => Promise<void>;
  getApiKey: (provider: string) => Promise<string | null>;
  deleteApiKey: (provider: string) => Promise<boolean>;
  listProviders: () => Promise<Record<string, boolean>>;
  restartServer: () => Promise<{ ok: true } | { ok: false; error: string }>;
  platform: NodeJS.Platform;
}

const api: DesktopBridge = {
  setApiKey: (provider, value) =>
    ipcRenderer.invoke("keychain:set", provider, value),
  getApiKey: (provider) => ipcRenderer.invoke("keychain:get", provider),
  deleteApiKey: (provider) => ipcRenderer.invoke("keychain:delete", provider),
  listProviders: () => ipcRenderer.invoke("keychain:list"),
  restartServer: () => ipcRenderer.invoke("app:restart-server"),
  platform: process.platform,
};

contextBridge.exposeInMainWorld("desktop", api);
