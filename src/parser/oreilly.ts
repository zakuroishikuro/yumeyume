import { DOMParser, HTMLDocument, normalize } from "../../deps.ts";
import { fetchData } from "../fetch_data.ts";
import { getItemProps } from "../utils.ts";

//const SITE_NAME = "オライリー";
const SITE_URL = new URL("https://www.oreilly.co.jp/ebook");

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
  const html = await fetchData(SITE_URL);
  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html")!;
  return getURLs(document);
}

async function scrapeDetails(urls: string[]) {
  const parser = new DOMParser();

  const items: DetailedItem[] = [];
  for (const url of urls) {
    const jsonURL = new URL(`${url}biblio.json`);
    const jsonStr = await fetchData(jsonURL);
    const json: JsonItem = JSON.parse(jsonStr);

    const pageURL = new URL(url);
    const html = await fetchData(pageURL);
    const doc = parser.parseFromString(html, "text/html")!;
    const itemprops = getItemProps(doc.body);

    const item = {
      ...json,
      description: itemprops.description,
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
