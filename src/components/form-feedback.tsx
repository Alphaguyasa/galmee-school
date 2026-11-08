import type { FormState } from "@/actions/auth";

/** Error and success lines under a form; `t` resolves message keys from the form's namespace. */
export function FormFeedback({ state, t }: { state: FormState; t: (key: string) => string }) {
  if (state?.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {t(state.error)}
      </p>
    );
  }
  if (state?.info) {
    return (
      <p role="status" className="rounded-md bg-accent p-3 text-sm">
        {t(state.info)}
      </p>
    );
  }
  return null;
}
