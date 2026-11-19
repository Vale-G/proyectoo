import Image from "next/image";
import type { CSSProperties } from "react";

export type WorkshopIdentity = {name:string;logoUrl?:string|null;accent?:string|null};
/** Brand inputs belong to the resolved workshop. Appearance is a separate user preference. */
export function brandStyle(identity:WorkshopIdentity):CSSProperties|undefined {
  return /^#[0-9a-f]{6}$/i.test(identity.accent??"") ? {"--workshop-accent":identity.accent} as CSSProperties : undefined;
}
export function WorkshopIdentityMark({identity}:{identity:WorkshopIdentity}){
  const logo=identity.logoUrl && /^https:\/\//i.test(identity.logoUrl)?identity.logoUrl:null;
  return <span className="workshop-identity">
    {logo ? <Image src={logo} alt="" width={40} height={40} unoptimized/> : <span className="workshop-monogram" aria-hidden="true">{identity.name.slice(0,1).toLocaleUpperCase("es")}</span>}
    <span><strong>{identity.name}</strong><small>Gestión del taller</small></span>
  </span>;
}
