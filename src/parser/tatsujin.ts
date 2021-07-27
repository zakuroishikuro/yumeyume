import { delay, DOMParser, HTMLDocument } from "../../deps.ts";
import { fetchData, isCached } from "../fetch_data.ts";
import { toInt } from "../toInt.ts";

const SITE_NAME = "達人出版会";
const SITE_URL = "https://tatsu-zine.com/books";

function print(message: string) {
  console.log(`[${SITE_NAME}] ${message}`);
}

type SummaryItem = {
  url: string;
  title: string;
  author: string;
  publisher: string;
  pdf: boolean;
  epub: boolean;
  price: number | undefined;
  description: string | undefined;
};

type DetailedItem = SummaryItem & {
  released: string | undefined;
  pages: number | undefined;
};

function getItems(doc: HTMLDocument) {
  const elements = doc.querySelector(".booklist")!.getElementsByClassName(
    "book",
  );
  return [...elements].map((e) => {
    const a = e.querySelector("h3 a");
    if (a == null) return;
    const url = new URL(SITE_URL).origin + a.getAttribute("href")!;
    const title = a.textContent.trim();
    const author = e.querySelector(".author")!.textContent.trim();
    const publisher = e.querySelector(".publisher")!.textContent.trim();

    const pdf = e.querySelector("[src*=pdf]") != null;
    const epub = e.querySelector("[src*=epub]") != null;

    const priceElement = e.querySelector("span[itemprop=price]");
    const descriptionElement = e.querySelector("p[itemprop=description]");

    const price = priceElement?.textContent.replace(/\D/g, "");
    const description = descriptionElement?.textContent.trim();

    return {
      url,
      title,
      author,
      publisher,
      pdf,
      epub,
      price,
      description,
    } as SummaryItem;
  }).filter((item) => item != null) as SummaryItem[];
}

async function scrape() {
  const parser = new DOMParser();

  const url = new URL(SITE_URL);
  print(`loading... ${url}`);
  const html = await fetchData(url);
  const doc = parser.parseFromString(html, "text/html")!;

  const items = getItems(doc);
  return items;
}

function getDetail(doc: HTMLDocument) {
  const datePublished = doc.querySelector("span[itemprop=datePublished]")!;
  const pages = doc.querySelector("span[itemprop=numberOfPages]")!;

  return {
    released: datePublished.textContent.replace(/-/g, "/"),
    pages: toInt(pages.textContent.replace(/\D+/g, "")),
  };
}

async function scrapaDetails(items: SummaryItem[]) {
  const parser = new DOMParser();

  const detailedItems: DetailedItem[] = [];
  for (const item of items) {
    const url = new URL(item.url);
    print(`loading... ${url}`);
    const html = await fetchData(url);
    if (!isCached(url)) {
      await delay(5, 10);
    }
    const doc = parser.parseFromString(html, "text/html")!;
    const detail = getDetail(doc);
    detailedItems.push({
      ...item,
      ...detail,
    });
  }

  return detailedItems;
}

if (import.meta.main) {
  const items = await scrape();
  const details = await scrapaDetails(items);
  console.log(details);
}
