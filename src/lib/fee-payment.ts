/** Building a fee payment on the phone, before it goes to `sc_record_fee_payment` (now or from the offline queue). */

export const PAY_METHODS = ["cash", "telebirr", "cbe_birr", "bank", "other"] as const;
export type PayMethod = (typeof PAY_METHODS)[number];

export type FeePaymentArgs = {
  p_invoice: string;
  p_amount: number;
  p_method: PayMethod;
  p_reference: string | null;
  p_client_ref: string;
};

export type FeePaymentCheck = { ok: true; args: FeePaymentArgs } | { ok: false; error: "errorAmount" | "errorOverpayment" };

/**
 * Checks the form fields and builds the RPC arguments. The amount must be birr
 * with at most 2 decimals, above zero and not above what is left to pay (the
 * server checks again; this only catches typos early, also when offline).
 */
export function buildFeePayment(input: {
  invoiceId: string;
  remaining: number;
  amount: string;
  method: string;
  reference: string;
  clientRef: string;
}): FeePaymentCheck {
  const text = input.amount.trim().replace(/,/g, "");
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(text)) return { ok: false, error: "errorAmount" };
  const amount = Number(text);
  if (!(amount > 0)) return { ok: false, error: "errorAmount" };
  if (Math.round(amount * 100) > Math.round(input.remaining * 100)) return { ok: false, error: "errorOverpayment" };
  const method = (PAY_METHODS as readonly string[]).includes(input.method) ? (input.method as PayMethod) : "cash";
  const reference = input.reference.trim().slice(0, 60);
  return {
    ok: true,
    args: {
      p_invoice: input.invoiceId,
      p_amount: amount,
      p_method: method,
      p_reference: reference || null,
      p_client_ref: input.clientRef,
    },
  };
}

/** Message key (namespace `fees`) for a payment the server refused while the user waited. */
export function paymentErrorKey(message: string): "errorOverpayment" | "errorAmount" | "errorPayment" {
  if (message.includes("overpayment")) return "errorOverpayment";
  if (message.includes("invalid_amount")) return "errorAmount";
  return "errorPayment";
}

/** The receipt id returned by `sc_record_fee_payment`, or null if the answer has none. */
export function receiptIdOf(data: unknown): string | null {
  if (data && typeof data === "object" && "receipt_id" in data) {
    const id = (data as { receipt_id: unknown }).receipt_id;
    return typeof id === "string" ? id : null;
  }
  return null;
}
