import { sum } from "src/sum.ts";

import { assertEquals } from "asserts.ts";
const { test } = Deno;

test("[sum] 1 + 1 = 2", ()=>{
  assertEquals(sum(1, 1), 2);
})