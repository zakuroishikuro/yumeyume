export function toInt(str: string) {
  return parseInt(str.replace(/\D+/g, ""));
}
