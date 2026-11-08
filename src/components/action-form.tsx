"use client";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";

export function ActionForm({ action, children, className }: { action: (form: FormData) => Promise<ActionResult>; children: ReactNode; className?: string }) {
  const [feedback, setFeedback] = useState<ActionResult>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setFeedback({});
    startTransition(async () => {
      try {
        const result = await action(data);
        if (result) { setFeedback(result); if (result.success) router.refresh(); }
      } catch { setFeedback({ error: "No se pudo confirmar el guardado. Recargá la página y comprobá el estado antes de volver a intentar." }); }
    });
  }
  return <form action={async data => { await action(data); }} onSubmit={submit} className={className} aria-busy={pending}><fieldset disabled={pending} className="action-fields">{children}</fieldset>
    {pending && !feedback.success && !feedback.error && <p role="status" className="form-feedback">Guardando…</p>}
    {feedback.error && <p role="alert" className="form-feedback error">{feedback.error}</p>}
    {feedback.success && <p role="status" className="form-feedback success">{feedback.success}</p>}
  </form>;
}
