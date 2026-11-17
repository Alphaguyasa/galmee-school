const METHOD_KEYS: Record<string, string> = {
  cash: "methodCash",
  telebirr: "methodTelebirr",
  cbe_birr: "methodCbe",
  bank: "methodBank",
};

/** Message key (namespace `fees`) for a payment method; unknown methods read as "Other". */
export function payMethodKey(method: string): string {
  return METHOD_KEYS[method] ?? "methodOther";
}
