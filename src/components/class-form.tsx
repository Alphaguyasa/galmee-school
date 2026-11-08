"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addClassAction } from "@/actions/students";
import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClassForm() {
  const t = useTranslations("students");
  const [state, action, pending] = useActionState(addClassAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <div className="grid gap-2">
          <Label htmlFor="grade">{t("grade")}</Label>
          <Input id="grade" name="grade" placeholder={t("gradeExample")} maxLength={30} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="section">{t("section")}</Label>
          <Input id="section" name="section" defaultValue="A" maxLength={10} required />
        </div>
      </div>
      <FormFeedback state={state} t={t} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {t("addClass")}
      </Button>
    </form>
  );
}
