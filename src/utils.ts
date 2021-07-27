import { Element } from "../deps.ts";

/** 名前も表示するだけのconsole.log */
export function print(name: string, message: string) {
  console.log(`[${name}] ${message}`);
}

/** 数字以外を全て削除してtoInt */
export function toInt(str: string) {
  if (str != null) return parseInt(str.replace(/\D+/g, ""));
}

function allChildren(root: Element): Element[] {
  return [root, ...[...root.children].flatMap(allChildren)];
}

/** 要素のitemprop属性を雑に連想配列として取得 */
export function getItemProps(e: Element) {
  // なんか`e.querySelectorAll("[itemprop]")`にしたいけど、なんか持ってきてくれないことがある
  // ちょっとアレだけど動くからいいや
  const itemprops = allChildren(e).filter((e) => e.hasAttribute("itemprop"));

  const kv = itemprops.map((prop) => {
    const key = prop.getAttribute("itemprop");

    let value;
    value ||= prop.getAttribute("href");
    value ||= prop.getAttribute("src");
    value ||= prop.getAttribute("datetime");
    value ||= prop.textContent;
    value = value.trim();

    return [key, value];
  });
  return Object.fromEntries(kv);
}
