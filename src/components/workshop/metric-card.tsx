import Link from "next/link";
export function MetricCard({href,count,label,tone,icon}:{href:string;count:number;label:string;tone:"info"|"warning"|"quote"|"success";icon:string}){
  return <Link href={href} className={"workshop-metric tone-"+tone}>
    <span className="metric-label">{label}</span><strong>{count}</strong><span className="metric-symbol" aria-hidden="true">{icon}</span>
  </Link>;
}
