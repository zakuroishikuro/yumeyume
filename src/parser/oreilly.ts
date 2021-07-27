import { delay, DOMParser, HTMLDocument, normalize } from "../../deps.ts";
import { fetchData, isCached } from "../fetch_data.ts";

const SITE_NAME = "オライリー";
const SITE_URL = new URL("https://www.oreilly.co.jp/ebook");

function print(message: string) {
  console.log(`[${SITE_NAME}] ${message}`);
}

type JsonItem = {
  title: string;
  subtitle: string;
  // deno-lint-ignore camelcase
  picture_large: string;
  picture: string;
  // deno-lint-ignore camelcase
  picture_small: string;
  authors: string[];
  released: string;
  pages: number;
  price: number;
  // deno-lint-ignore camelcase
  ebook_price: number;
  original: string;
  // deno-lint-ignore camelcase
  original_url: string;
  isbn: string;
  status: string;
  // deno-lint-ignore camelcase
  is_pdf: boolean;
  // deno-lint-ignore camelcase
  is_epub: boolean;
  // deno-lint-ignore camelcase
  is_mobi: boolean;
  furigana: string;
};

type DetailedItem = JsonItem & {
  description: string;
  tableOfContents: string;
};

function getURLs(doc: HTMLDocument) {
  const table = doc.getElementById("bookTable")!.querySelector("tbody")!;
  return [...table.children].map((row) => {
    const a = row.querySelector("a")!;
    return normalize(SITE_URL + "/" + a.getAttribute("href"));
  });
}

async function scrape() {
  print(`loading... ${SITE_URL}`);
  const html = await fetchData(SITE_URL);
  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html")!;
  return getURLs(document);
}

async function scrapeDetails(urls: string[]) {
  const parser = new DOMParser();

  const items: DetailedItem[] = [];
  for (const url of urls) {
    print(`loading... ${url}`);

    const jsonURL = new URL(`${url}biblio.json`);
    if (!isCached(jsonURL)) {
      delay(1, 3);
    }
    const jsonStr = await fetchData(jsonURL);
    const json: JsonItem = JSON.parse(jsonStr);

    const pageURL = new URL(url);
    if (!isCached(pageURL)) {
      delay(4, 8);
    }
    const html = await fetchData(pageURL);
    const doc = parser.parseFromString(html, "text/html")!;

    const item = {
      ...json,
      description: doc.querySelector("[itemprop=description]")!.textContent
        .trim(),
      tableOfContents: doc.getElementById("toc")!.querySelector("pre")!
        .textContent.trim(),
    };

    items.push(item);
  }

  return items;
}

if (import.meta.main) {
  const urls = await scrape();
  const items = await scrapeDetails(urls);
  console.log(items);
}
