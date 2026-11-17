"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { MessageSquareText } from "lucide-react";
import { addFeePlanAction, generateInvoicesAction, recordPaymentAction, sendRemindersAction } from "@/actions/fees";
import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function GenerateInvoicesForm({
  options,
  defaultValue,
}: {
  options: { value: string; label: string }[];
  defaultValue: string;
}) {
  const t = useTranslations("fees");
  const [state, action, pending] = useActionState(generateInvoicesAction, undefined);
  return (
    <form action={action} className="grid gap-2">
      <Label htmlFor="period">{t("generateFor")}</Label>
      <div className="flex gap-2">
        <Select id="period" name="period" defaultValue={defaultValue}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          {t("generate")}
        </Button>
      </div>
      <FormFeedback state={state} t={t} />
    </form>
  );
}

export function FeePlanForm({ grades }: { grades: string[] }) {
  const t = useTranslations("fees");
  const [state, action, pending] = useActionState(addFeePlanAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">{t("planName")}</Label>
        <Input id="name" name="name" placeholder={t("planNameExample")} maxLength={80} required />
      </div>
      <div className="grid grid-cols-2 items-end gap-3">
        <div className="grid gap-2">
          <Label htmlFor="grade">{t("planGrade")}</Label>
          <Select id="grade" name="grade" defaultValue="">
            <option value="">{t("allGrades")}</option>
            {grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="planPeriod">{t("planPeriod")}</Label>
          <Select id="planPeriod" name="period" defaultValue="monthly">
            <option value="monthly">{t("periodMonthly")}</option>
            <option value="term">{t("periodTerm")}</option>
            <option value="annual">{t("periodAnnual")}</option>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">{t("amountBirr")}</Label>
        <Input id="amount" name="amount" inputMode="decimal" autoComplete="off" required />
      </div>
      <FormFeedback state={state} t={t} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {t("addPlan")}
      </Button>
    </form>
  );
}

export function PaymentForm({ invoiceId, remaining }: { invoiceId: string; remaining: number }) {
  const t = useTranslations("fees");
  const [state, action, pending] = useActionState(recordPaymentAction, undefined);
  // One id per form: retries of the same submit cannot record the payment twice.
  const [clientRef] = useState(() => crypto.randomUUID());
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input type="hidden" name="clientRef" value={clientRef} />
      <div className="grid gap-2">
        <Label htmlFor="amount">{t("amountBirr")}</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={remaining.toFixed(2)}
          className="num text-xl font-bold"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="method">{t("method")}</Label>
        <Select id="method" name="method" defaultValue="cash">
          <option value="cash">{t("methodCash")}</option>
          <option value="telebirr">{t("methodTelebirr")}</option>
          <option value="cbe_birr">{t("methodCbe")}</option>
          <option value="bank">{t("methodBank")}</option>
          <option value="other">{t("methodOther")}</option>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reference">{t("reference")}</Label>
        <Input id="reference" name="reference" autoComplete="off" maxLength={60} />
      </div>
      <FormFeedback state={state} t={t} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {t("recordPayment")}
      </Button>
    </form>
  );
}

export function SendRemindersForm({
  classId,
  period,
  unpaidCount,
}: {
  classId: string;
  period: string;
  unpaidCount: number;
}) {
  const t = useTranslations("fees");
  const [state, action, pending] = useActionState(sendRemindersAction, undefined);
  return (
    <form action={action} className="grid gap-2 border-l-2 border-margin py-1 pl-4">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="period" value={period} />
      <h2 className="font-semibold">{t("remindHeading")}</h2>
      <p className="text-sm text-muted-foreground">{t("remindHint")}</p>
      <Button type="submit" variant="outline" disabled={pending} aria-busy={pending} className="justify-self-start">
        <MessageSquareText className="size-4" aria-hidden />
        {t("remindButton", { count: unpaidCount })}
      </Button>
      {state && "error" in state ? (
        <p role="alert" className="text-sm text-destructive">
          {t(state.error)}
        </p>
      ) : null}
      {state && "queued" in state ? (
        <div role="status" className="grid gap-1 rounded-md bg-accent p-3 text-sm">
          <p className="font-semibold">{t("remindQueued", { count: state.queued })}</p>
          {state.alreadyToday > 0 ? <p>{t("remindAlready", { count: state.alreadyToday })}</p> : null}
          {state.noPhone > 0 ? <p>{t("remindNoPhone", { count: state.noPhone })}</p> : null}
        </div>
      ) : null}
    </form>
  );
}
