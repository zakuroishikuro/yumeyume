export {
  DOMParser,
  Element,
  HTMLDocument,
} from "https://deno.land/x/deno_dom@v0.1.12-alpha/deno-dom-wasm.ts";

export {
  ensureDir,
  ensureFile,
  exists,
} from "https://deno.land/std@0.103.0/fs/mod.ts";

export { dirname, join } from "https://deno.land/std@0.103.0/path/mod.ts";

export {
  sleepRandomAmountOfSeconds as delay,
} from "https://deno.land/x/sleep@v1.2.0/mod.ts";
