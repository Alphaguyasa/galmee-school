import { useTranslations } from "next-intl";
import { Check, Minus, X } from "lucide-react";

const STYLES = {
  paid: { icon: Check, color: "text-paid", word: "statusPaid" },
  partial: { icon: Minus, color: "text-warning", word: "statusPartial" },
  unpaid: { icon: X, color: "text-margin", word: "statusUnpaid" },
} as const;

/** A teacher's mark for the margin: an icon, and the word for screen readers and colour-blind users. */
export function FeeStatusMark({ status }: { status: string }) {
  const t = useTranslations("fees");
  const { icon: Icon, color, word } = STYLES[status as keyof typeof STYLES] ?? STYLES.unpaid;
  return (
    <span className={`flex items-center justify-center border-r-2 border-margin ${color}`}>
      <Icon className="size-5" aria-hidden />
      <span className="sr-only">{t(word)}</span>
    </span>
  );
}

export function feeStatusWord(status: string) {
  return STYLES[status as keyof typeof STYLES]?.word ?? STYLES.unpaid.word;
}
