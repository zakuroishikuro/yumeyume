import { delay, ensureFile, exists, join } from "../deps.ts";

const SLEEP_MIN_SEC = 4;
const SLEEP_MAX_SEC = 12;
const CACHE_DIR = "./_cache";

type CacheOptions = {
  cacheDir?: string;
  forceRefresh?: boolean;
  log?: boolean;
};

/** cache付きのfetch (文字列だけ) */
export async function fetchData(
  url: URL,
  opts: CacheOptions = {},
) {
  const { cacheDir = CACHE_DIR, forceRefresh, log = true } = opts;
  const filePath = getCacheFilePath(url, cacheDir);

  if (log) {
    console.log(`[${url.hostname}] loading... ${url}`);
  }

  if (forceRefresh) {
    const cachePath = getCacheFilePath(url, cacheDir);
    if (await exists(cachePath)) {
      await Deno.remove(cachePath);
    }
  }

  if (await isCached(url, cacheDir)) {
    return await Deno.readTextFile(filePath);
  } else {
    const responce = await fetch(url);
    await delay(SLEEP_MIN_SEC, SLEEP_MAX_SEC);

    const text = await responce.text();
    await ensureFile(filePath);

    await Deno.writeTextFile(filePath, text);
    return text;
  }
}

/** キャッシュ全消去 */
export async function clearCache(cacheDir = CACHE_DIR) {
  if (await exists(cacheDir)) {
    await Deno.remove(cacheDir, { recursive: true });
  }
}

/** キャッシュのパス (存在するかしないかに関わらず) */
export function getCacheFilePath(url: URL, cacheDir = CACHE_DIR) {
  return join(
    cacheDir,
    url.hostname,
    url.pathname,
    encodeURIComponent(url.search),
  ).trim().replace(/[^\w.\/]/g, "_").replace(/\/$/, "") + "_cache.txt";
}

/** キャッシュされてるか田舎 */
export async function isCached(url: URL, cacheDir = CACHE_DIR) {
  const path = getCacheFilePath(url, cacheDir);
  return await exists(path);
}

if (import.meta.main) {
  const str = getCacheFilePath(
    new URL("http://yahoo.co.jp/nya/nyu/nyo?key=value?key2=value2"),
  );
  console.log(str);
}
