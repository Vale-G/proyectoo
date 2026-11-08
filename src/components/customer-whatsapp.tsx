function digits(value:string){return value.replace(/\D/g,"");}
export function CustomerWhatsApp({phone,orderNumber,device}:{phone:string;orderNumber:string;device:string}) {
  const messages=[
    ["Recepción",`Hola, somos OmniFix. Recibimos tu ${device}. Tu orden es la #${orderNumber}. Conservá el comprobante y el enlace de seguimiento.`],
    ["Presupuesto listo",`Hola. El presupuesto de tu orden #${orderNumber} ya está listo. Revisalo y confirmarnos si autorizás el trabajo.`],
    ["Listo para retirar",`Hola. Tu equipo de la orden #${orderNumber} está listo para retirar. Coordinemos la entrega.`],
    ["Recordar retiro",`Hola. Te recordamos que la orden #${orderNumber} continúa lista para retirar. Avisanos cuándo podés pasar.`],
  ];
  return <div className="whatsapp-actions">{messages.map(([label,message])=><a key={label} className="button secondary" href={`https://wa.me/${digits(phone)}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">WhatsApp · {label}</a>)}</div>;
}
