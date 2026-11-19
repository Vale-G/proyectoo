import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { workshops, workshopMembers } from "@/db/schema";
import { requireWorkshopAccess } from "@/lib/auth";
import { resolveWorkshop, WorkshopAccessError } from "@/lib/workshop-membership";

async function selectWorkshop(form: FormData) {
  "use server";
  const user = await requireWorkshopAccess();
  const id = String(form.get("workshopId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new WorkshopAccessError("Taller inválido.");
  await resolveWorkshop(db(), user.id, id);
  (await cookies()).set("workshop_id", id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 86400 });
  redirect("/");
}
export default async function WorkshopsPage() {
  const user = await requireWorkshopAccess();
  const rows = await db().select({id: workshops.id, name: workshops.publicName, role: workshopMembers.role})
    .from(workshopMembers).innerJoin(workshops, eq(workshopMembers.workshopId,workshops.id))
    .where(and(eq(workshopMembers.userId,user.id),eq(workshopMembers.active,true)));
  const enabled = rows.filter(row=>row.role==="owner" || row.role==="admin");
  return <main className="login-page"><section className="login-card"><h1>Elegí tu taller</h1>
    {enabled.length ? enabled.map(row=><form key={row.id} action={selectWorkshop}><input type="hidden" name="workshopId" value={row.id}/><button className="button primary full">{row.name}</button></form>)
      : <p>Tu cuenta todavía no tiene una membresía operativa habilitada. Contactá al administrador.</p>}
    <form action="/auth/logout" method="post"><button className="button secondary">Cerrar sesión</button></form>
  </section></main>;
}
