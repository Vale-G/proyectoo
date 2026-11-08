"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { assertDatabaseReady } from "@/lib/database-readiness";
import { repairStore } from "@/lib/repair-store";
import { validationMessage } from "@/lib/intake";
import type { ActionResult } from "@/lib/action-result";
export async function respondToPublicQuote(form:FormData):Promise<ActionResult>{
  try{
    const input=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),revision:z.coerce.number().int().nonnegative(),decision:z.enum(["approved","rejected"]),name:z.string().trim().min(2).max(160)}).parse(Object.fromEntries(form));
    const database=db();await assertDatabaseReady(database);await repairStore(database).respondToQuote(input.token,input.revision,input.decision,input.name);
    revalidatePath(`/seguimiento/${input.token}`);return {success:input.decision === "approved" ? "Aprobación registrada. OmniFix ya puede continuar con el trabajo acordado." : "Rechazo registrado. OmniFix se comunicará para coordinar los próximos pasos."};
  }catch(error){return {error:validationMessage(error)};}
}
