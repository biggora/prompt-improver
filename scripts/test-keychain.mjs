// Smoke-test for keychain.ts: invoked by Electron (so keytar ABI matches),
// runs against a TEST service name to avoid touching production keys.
import { app } from "electron";
import keytar from "keytar";
const { setPassword, getPassword, deletePassword } = keytar;

const SERVICE = "prompt-improver-smoke-test";
const KEY = "smoke";
const VALUE = "hello-" + Date.now();

(async () => {
  await app.whenReady();
  let exitCode = 0;
  try {
    await setPassword(SERVICE, KEY, VALUE);
    const got = await getPassword(SERVICE, KEY);
    if (got !== VALUE) throw new Error(`Round-trip mismatch: got=${got}`);
    const deleted = await deletePassword(SERVICE, KEY);
    if (!deleted) throw new Error("delete returned false");
    const afterDelete = await getPassword(SERVICE, KEY);
    if (afterDelete !== null) throw new Error("Key still present after delete");
    console.log("[smoke] keychain set/get/delete OK");
    console.log("[smoke] platform:", process.platform);
  } catch (err) {
    console.error("[smoke] FAILED: keychain smoke test error");
    exitCode = 1;
  } finally {
    app.exit(exitCode);
  }
})();
