"use client";
import { Children, useState, type ReactNode, type FormEvent } from "react";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import type { ActionResult } from "@/lib/action-result";

const stages=["Cliente y equipo","Recepción","Pruebas iniciales","Presupuesto","Autorización"];
export function IntakeWizard({children,action}:{children:ReactNode;action:(data:FormData)=>Promise<ActionResult>}){
  const [step,setStep]=useState(0);
  const [expanded,setExpanded]=useState(false);
  const sections=Children.toArray(children);
  function validate(event:FormEvent<HTMLDivElement>){
    const form=event.target as HTMLFormElement;
    const invalid=Array.from(form.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>("input,select,textarea")).find(el=>!el.validity.valid);
    if(!invalid) return;
    event.preventDefault();
    event.stopPropagation();
    setStep(Number(invalid.closest<HTMLElement>("[data-stage]")?.dataset.stage??0));
    requestAnimationFrame(()=>{invalid.focus();invalid.reportValidity()});
  }
  function advance(button:HTMLButtonElement){
    const region=button.closest(".intake-wizard")?.querySelector<HTMLElement>('[data-stage="'+step+'"]');
    const invalid=Array.from(region?.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>("input,select,textarea")??[]).find(el=>!el.validity.valid);
    if(invalid){invalid.reportValidity();return}
    setStep(step+1);
    button.closest(".intake-wizard")?.scrollIntoView({block:"start"});
  }
  return <div className="intake-wizard" onSubmitCapture={validate}>
    <nav className="intake-progress" aria-label="Etapas de recepción">
      {stages.map((name,index)=><button key={name} type="button" aria-current={index===step?"step":undefined} onClick={event=>{setStep(index);event.currentTarget.scrollIntoView({block:"nearest",inline:"center"})}}><span>{index+1}</span>{name}</button>)}
    </nav>
    <p className="wizard-stage-label" role="status">Etapa {step+1} de {stages.length} · {stages[step]}</p>
    <ActionForm action={action} className="intake-form" noValidate>
      {sections.map((section,index)=><div key={index} data-stage={index} hidden={!expanded && step!==index}>{section}</div>)}
      <div className="wizard-controls">
        <Link className="button secondary" href="/orders">Cancelar</Link>
        {step>0 && <button className="button secondary" type="button" onClick={()=>setStep(step-1)}>Anterior</button>}
        {step<stages.length-1 && !expanded ? <button className="button primary" type="button" onClick={event=>advance(event.currentTarget)}>Continuar →</button>
          : <button className="button primary" type="submit">Guardar recepción</button>}
      </div>
    </ActionForm>
    <button className="wizard-expand" type="button" onClick={()=>setExpanded(!expanded)}>{expanded?"Volver a las etapas":"Ver formulario completo"}</button>
  </div>;
}
