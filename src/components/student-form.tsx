"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addStudentAction } from "@/actions/students";
import { FormFeedback } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function StudentForm({
  classes,
  defaultClass,
}: {
  classes: { id: string; label: string }[];
  defaultClass?: string;
}) {
  const t = useTranslations("students");
  const [state, action, pending] = useActionState(addStudentAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="classId">{t("class")}</Label>
        <Select id="classId" name="classId" defaultValue={defaultClass} required>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Input id="fullName" name="fullName" autoComplete="off" maxLength={120} required />
      </div>
      <div className="grid grid-cols-2 items-end gap-3">
        <div className="grid gap-2">
          <Label htmlFor="gender">{t("gender")}</Label>
          <Select id="gender" name="gender" required>
            <option value="f">{t("female")}</option>
            <option value="m">{t("male")}</option>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="studentNo">{t("studentNo")}</Label>
          <Input id="studentNo" name="studentNo" autoComplete="off" maxLength={30} />
        </div>
      </div>
      <fieldset className="grid gap-4 border-t pt-4">
        <legend className="pr-2 text-sm font-semibold">{t("parent")}</legend>
        <div className="grid gap-2">
          <Label htmlFor="guardianName">{t("parentName")}</Label>
          <Input id="guardianName" name="guardianName" autoComplete="off" maxLength={120} required />
        </div>
        <div className="grid grid-cols-2 items-end gap-3">
          <div className="grid gap-2">
            <Label htmlFor="guardianPhone">{t("parentPhone")}</Label>
            <Input id="guardianPhone" name="guardianPhone" type="tel" autoComplete="off" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="relation">{t("relation")}</Label>
            <Select id="relation" name="relation" defaultValue="parent" required>
              <option value="parent">{t("relationParent")}</option>
              <option value="mother">{t("relationMother")}</option>
              <option value="father">{t("relationFather")}</option>
              <option value="guardian">{t("relationGuardian")}</option>
              <option value="other">{t("relationOther")}</option>
            </Select>
          </div>
        </div>
      </fieldset>
      <FormFeedback state={state} t={t} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {t("addStudent")}
      </Button>
    </form>
  );
}
