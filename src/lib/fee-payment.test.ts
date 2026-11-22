import { describe, expect, it } from "vitest";
import { buildFeePayment, paymentErrorKey, receiptIdOf } from "./fee-payment";

const base = {
  invoiceId: "11111111-1111-4111-8111-111111111111",
  remaining: 1500,
  amount: "1500",
  method: "cash",
  reference: "",
  clientRef: "22222222-2222-4222-8222-222222222222",
};

describe("buildFeePayment", () => {
  it("builds the RPC arguments with the form's client ref", () => {
    expect(buildFeePayment({ ...base, amount: " 1,200.50 ", method: "telebirr", reference: " TX9 " })).toEqual({
      ok: true,
      args: {
        p_invoice: base.invoiceId,
        p_amount: 1200.5,
        p_method: "telebirr",
        p_reference: "TX9",
        p_client_ref: base.clientRef,
      },
    });
  });

  it("refuses empty, zero, negative and over-precise amounts", () => {
    for (const amount of ["", "0", "-5", "12.345", "abc", "1e3"]) {
      expect(buildFeePayment({ ...base, amount })).toEqual({ ok: false, error: "errorAmount" });
    }
  });

  it("refuses more than is left to pay, in whole cents", () => {
    expect(buildFeePayment({ ...base, remaining: 100.1, amount: "100.11" })).toEqual({ ok: false, error: "errorOverpayment" });
    expect(buildFeePayment({ ...base, remaining: 100.1, amount: "100.10" }).ok).toBe(true);
  });

  it("falls back to cash for an unknown method and sends no empty reference", () => {
    const r = buildFeePayment({ ...base, method: "card", reference: "   " });
    expect(r.ok && r.args.p_method).toBe("cash");
    expect(r.ok && r.args.p_reference).toBeNull();
  });
});

describe("paymentErrorKey / receiptIdOf", () => {
  it("maps server errors to messages", () => {
    expect(paymentErrorKey("overpayment")).toBe("errorOverpayment");
    expect(paymentErrorKey("invalid_amount")).toBe("errorAmount");
    expect(paymentErrorKey("invoice_not_found")).toBe("errorPayment");
  });

  it("reads the receipt id only when it is there", () => {
    expect(receiptIdOf({ receipt_id: "r1", receipt_no: 4 })).toBe("r1");
    expect(receiptIdOf(null)).toBeNull();
    expect(receiptIdOf("r1")).toBeNull();
  });
});
