import { app, BrowserWindow, ipcMain, shell, Menu } from "electron";
import * as path from "node:path";
import {
  startNextServer,
  stopNextServer,
  restartNextServer,
  getCurrentPort,
} from "./next-server";
import * as keychain from "./keychain";

const DEV_URL = process.env.ELECTRON_DEV_URL;
const isDev = !!DEV_URL;

let mainWindow: BrowserWindow | null = null;

async function createWindow(targetUrl: string): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: "#0a0a0a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (["https:", "http:", "mailto:"].includes(parsed.protocol)) {
        shell.openExternal(url);
      }
    } catch {
      // ignore malformed URLs
    }
    return { action: "deny" };
  });

  const appOrigin = new URL(targetUrl).origin;
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    try {
      if (new URL(navigationUrl).origin !== appOrigin) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  await mainWindow.loadURL(targetUrl);
}

async function bootstrap(): Promise<void> {
  if (isDev && DEV_URL) {
    await createWindow(DEV_URL);
    return;
  }

  const apiKeys = await keychain.getAllKeysAsEnv();
  const port = await startNextServer({ env: apiKeys });
  await createWindow(`http://127.0.0.1:${port}`);
}

function registerIpc(): void {
  ipcMain.handle("keychain:set", async (_e, provider: string, value: string) => {
    await keychain.setKey(provider, value);
  });

  ipcMain.handle("keychain:get", async (_e, provider: string) => {
    return keychain.getKey(provider);
  });

  ipcMain.handle("keychain:delete", async (_e, provider: string) => {
    return keychain.deleteKey(provider);
  });

  ipcMain.handle("keychain:list", async () => {
    return keychain.listConfiguredProviders();
  });

  ipcMain.handle("app:restart-server", async () => {
    if (isDev) {
      return { ok: true };
    }
    try {
      const apiKeys = await keychain.getAllKeysAsEnv();
      const port = await restartNextServer({ env: apiKeys });
      if (mainWindow && !mainWindow.isDestroyed()) {
        await mainWindow.loadURL(`http://127.0.0.1:${port}`);
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });
}

function buildMenu(): void {
  const isMac = process.platform === "darwin";
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? ([{ role: "appMenu" }] as Electron.MenuItemConstructorOptions[])
      : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  registerIpc();
  buildMenu();
  try {
    await bootstrap();
  } catch (err) {
    console.error("Bootstrap failed:", err);
    app.quit();
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const port = getCurrentPort();
      if (isDev && DEV_URL) {
        await createWindow(DEV_URL);
      } else if (port) {
        await createWindow(`http://127.0.0.1:${port}`);
      } else {
        await bootstrap();
      }
    }
  });
});

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    await stopNextServer();
    app.quit();
  }
});

app.on("before-quit", async () => {
  await stopNextServer();
});
