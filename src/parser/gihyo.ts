import { DOMParser, Element, HTMLDocument } from "../../deps.ts";
import { fetchData } from "../fetch_data.ts";
import { getItemProps, toInt } from "../utils.ts";

//const SITE_NAME = "gihyo";
const SITE_URL = "https://gihyo.jp/dp";

function getItems(doc: HTMLDocument) {
  let elements = [...doc.querySelectorAll("#listBook > li")] as Element[];
  elements = elements.filter((e) => /^[\d-]+$/.test(e.id));

  const items = elements.map((e) => {
    const props = getItemProps(e);

    const title = props.name;
    const price = toInt(props.price.replace(/\D/g, ""));
    const url = new URL(SITE_URL).origin + props.url;
    const author = props.author;
    const released = props.datePublished?.replace(/-/g, "/");
    const isbn = e.getAttribute("id");
    const epub = e.querySelector(".epub") != null;
    const pdf = e.querySelector(".pdf") != null;
    return {
      title,
      author,
      price,
      url,
      isbn,
      released,
      epub,
      pdf,
    };
  });

  return items;
}

function getNextURL(doc: HTMLDocument) {
  const e = doc.querySelector("#pagingTop .next")!;
  const href = e.getAttribute("href");
  if (href != null) {
    return new URL(SITE_URL).origin + href;
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

if (import.meta.main) {
  const items = await scrape();
  console.log(items);
}
