import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type Appearance = "dark" | "light";
export function normalizeAppearance(value?: string): Appearance {
  return value === "light" ? "light" : "dark";
}
async function changeAppearance(form: FormData) {
  "use server";
  const theme = normalizeAppearance(String(form.get("appearance")));
  (await cookies()).set("workshop_appearance",theme,{
    path:"/",sameSite:"lax",httpOnly:true,secure:process.env.NODE_ENV==="production",maxAge:31536000,
  });
  revalidatePath("/","layout");
}
export function AppearanceControl({appearance}:{appearance:Appearance}) {
  return <form action={changeAppearance} className="appearance-control" aria-label="Apariencia del software">
    <button name="appearance" value="light" aria-pressed={appearance==="light"}>☀ <span>Claro</span></button>
    <button name="appearance" value="dark" aria-pressed={appearance==="dark"}>☾ <span>Oscuro</span></button>
  </form>;
}
