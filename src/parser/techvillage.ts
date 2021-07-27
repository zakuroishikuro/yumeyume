import { DOMParser, HTMLDocument } from "../../deps.ts";
import { fetchData } from "../fetch_data.ts";

//const SITE_NAME = "Tech Village";
const SITE_URL = "https://cc.cqpub.co.jp";

function getSummaryURL(page = 1) {
  // このサイトはページ1ページ目が0なので他と統一するため-1しとくï
  const actualPage = page - 1;
  return `${SITE_URL}/lib/system/doclib_list_new/p=${actualPage}/`;
}

function getSummaryNextPageURL(document: HTMLDocument) {
  const a = document.querySelector(".page-nav li:last-child a");
  if (!a) {
    return;
  } else {
    const href = a.getAttribute("href")!;
    return `${SITE_URL}/${href}`;
  }
}

type SummaryItem = {
  url: string;
  title: string;
  subTitle: string;
};

type DetailedItem = SummaryItem & {
  author: string;
  publisher: string;
  price: number;
  released: string;
  description: string;
  tableOfContents: string;
};

function getSummaryItems(document: HTMLDocument) {
  const elements = [
    ...document.querySelector(".itemList")!.getElementsByTagName("li"),
  ];

  return elements.map((e) => {
    return {
      url: SITE_URL + e.querySelector("a")!.getAttribute("href"),
      title: e.querySelector(".mainTitle")!.textContent.trim(),
      subTitle: e.querySelector(".subTitle")!.textContent.trim(),
    };
  });
}

async function scrape(forceRefresh = false) {
  const result: SummaryItem[] = [];
  const parser = new DOMParser();
  let nextUrl: string | undefined = getSummaryURL();

  while (nextUrl) {
    const text = await fetchData(new URL(nextUrl), { forceRefresh });
    const doc = parser.parseFromString(text, "text/html")!;
    const items = getSummaryItems(doc);
    nextUrl = getSummaryNextPageURL(doc);

    result.push(...items);
  }

  return result;
}

async function scrapeDetails(items: SummaryItem[]) {
  const parser = new DOMParser();
  const details = [];

  // flatMapにしたかったけど、async渡すと一気にダウンロードしちゃう
  for (const item of items) {
    const url = new URL(item.url);
    const text = await fetchData(url);

    const doc = parser.parseFromString(text, "text/html")!;

    // idもclassも何もついてないテーブルなので、こうするしかない
    const table = doc.querySelector("#itemDocArea [summary='商品詳細']")!;
    const rows = table.getElementsByTagName("tr");
    const dict = Object.fromEntries(rows.map((row) => {
      return [
        row.querySelector("th")!.textContent.trim(),
        row.querySelector("td")!.textContent.trim(),
      ];
    }));

    const detail: DetailedItem = {
      ...item,
      author: dict["著者"],
      publisher: dict["発行元"],
      price: parseInt(dict["価格（ライセンス料金）"]?.replace(/\D+/, "")),
      released: dict["発行日"],
      description: doc.querySelector("#commentaryArea p")!.textContent.trim(),
      tableOfContents: doc.querySelector("#tableContents")!.textContent.trim(),
    };

    details.push(detail);
  }

  return details;
}

if (import.meta.main) {
  const items = await scrape();
  const details = await scrapeDetails(items);
  console.log(details);
}
