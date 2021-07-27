import { fetchData, getCacheFilePath } from "../src/fetch_data.ts";
import { exists } from "../deps.ts";

import { assertEquals } from "../dev_deps.ts";

Deno.test("[fetchData]", async () => {
  const url = new URL("https://reqres.in/api/users?page=2");
  const text = await fetchData(url);
  const json = JSON.parse(text);

  console.log("server stopped.");
  assertEquals(json.page, 2);

  const filePath = getCacheFilePath(url);
  assertEquals(await exists(filePath), true);
});
