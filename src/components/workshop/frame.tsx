import Link from "next/link";
import { cookies } from "next/headers";
import { privateStore } from "@/lib/orders";
import { AppearanceControl, normalizeAppearance } from "./appearance";
import { WorkshopNavigation } from "./navigation";
import { WorkshopIdentityMark, brandStyle } from "./identity";

export async function AppFrame({children}:{children:React.ReactNode}){
  const {workshop}=await privateStore();
  const identity={name:workshop.publicName};
  const appearance=normalizeAppearance((await cookies()).get("workshop_appearance")?.value);
  return <div className="workshop-shell" style={brandStyle(identity)}>
    <a className="skip-link" href="#main-content">Saltar al contenido</a>
    <aside className="workshop-sidebar">
      <Link className="workshop-brand-link" href="/"><WorkshopIdentityMark identity={identity}/></Link>
      <p className="nav-section-label">Espacio de trabajo</p>
      <WorkshopNavigation/>
      <Link className="button primary sidebar-intake" href="/orders/new">＋ Nueva orden</Link>
      <div className="workshop-sidebar-bottom">
        <AppearanceControl appearance={appearance}/>
        <p className="platform-signature">Plataforma de talleres</p>
        <form action="/auth/logout" method="post"><button className="signout-button">Cerrar sesión ↗</button></form>
      </div>
    </aside>
    <header className="workshop-mobile-bar">
      <Link href="/"><WorkshopIdentityMark identity={identity}/></Link>
      <details className="mobile-workshop-menu"><summary>Menú</summary><div><WorkshopNavigation/><AppearanceControl appearance={appearance}/><form action="/auth/logout" method="post"><button className="signout-button">Cerrar sesión</button></form></div></details>
    </header>
    <main className="workshop-content" id="main-content" tabIndex={-1}>{children}</main>
  </div>;
}
