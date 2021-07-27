import { delay, DOMParser, HTMLDocument } from "../../deps.ts";
import { fetchData, isCached } from "../fetch_data.ts";
import { toInt } from "../utils.ts";

//const SITE_NAME = "ラムダノート";
const SITE_URL = "https://www.lambdanote.com/collections/frontpage";

type SummaryItem = {
  title: string;
  url: string;
  price: number;
};

function getItems(doc: HTMLDocument) {
  const base = doc.getElementById("Collection")!;
  const elements = base.getElementsByClassName("grid__item");
  const items = elements.map((e) => {
    const title = e.querySelector(".grid-view-item__title")!.textContent.trim();
    const price = toInt(
      e.querySelector(".product-price__price")!.textContent.match(
        /[\d,]+(?=\D*?$)/,
      )![0].replace(/\D+/g, ""),
    );
    const url = new URL(SITE_URL).origin +
      e.querySelector("a")!.getAttribute("href");
    return { title, price, url } as SummaryItem;
  });
  return items;
}

function getNextURL(doc: HTMLDocument) {
  const a = doc.querySelector(".pagination > :last-child a");
  if (a != null) {
    return new URL(SITE_URL).origin + a.getAttribute("href");
  }
}

async function scrape() {
  const parser = new DOMParser();

  const result = [];
  let nextURL: string | undefined = SITE_URL;
  while (nextURL != null) {
    const html = await fetchData(new URL(nextURL));
    const doc = parser.parseFromString(html, "text/html")!;

    const items = getItems(doc);
    result.push(...items);
    nextURL = getNextURL(doc);
  }

  return result;
}

function getDetail(doc: HTMLDocument) {
  const base = doc.querySelector(".product-single__description")!;
  const listItems = base.querySelectorAll("ul li");
  const listValues = [...listItems].map((li) => li.textContent.trim());

  const author = listValues.find((s) => /監修|編|著/.test(s)) || listValues[0];
  const isbn = listValues.find((s) => /isbn/i.test(s))?.replace(/\D+/, "") ||
    "";

  const released =
    listValues.find((s) => /発行/.test(s))?.match(/\d+年\d+月\d+/)?.[0].replace(
      /[年月]/g,
      "/",
    ) || "";

  const pagesStr = listValues.find((s) => /ページ/.test(s));
  const pages = pagesStr && toInt(pagesStr) ? toInt(pagesStr) : 0;

  return {
    author,
    pages,
    isbn,
    released,
  };
}

type DetailedItem = SummaryItem & {
  author: string;
  pages: number;
  isbn: string;
  released: string;
};

async function scrapeDetails(items: SummaryItem[]) {
  const parser = new DOMParser();
  const result: DetailedItem[] = [];

  for (const item of items) {
    if (!isCached(new URL(item.url))) {
      await delay(5, 10);
    }
    const text = await fetchData(new URL(item.url));
    const doc = parser.parseFromString(text, "text/html")!;

    const detail = getDetail(doc);
    result.push({
      ...item,
      ...detail,
    });
  }
  return result;
}

if (import.meta.main) {
  const items = await scrape();
  const details = await scrapeDetails(items);
  console.log(details);
}
