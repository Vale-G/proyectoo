import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RepairOrder } from "./repair-store";
import { formatDate, formatMoney } from "./format";
import { statusLabels } from "./status";
import { TESTS } from "./intake";
import { checkLabels, checkResultLabels } from "./repair-checks";
import { trackingUrl } from "./tracking-url";

export type ReceiptKind = "intake" | "delivery" | "quote";
export type IntakeLayout = "a4" | "a5" | "double" | "label";
const resultLabel = { passed: "Funciona", failed: "Presenta falla", not_tested: "No realizada" };
const powerLabel = { on: "Enciende", off: "No enciende", unknown: "No comprobado" };
const yesNo = { yes: "Sí", no: "No", unknown: "Sin determinar" };
// Deliberate allowlist: never serialize the private order object into a document.
export function receiptSections(order: RepairOrder, kind: ReceiptKind) {
  if (kind === "delivery" && !order.deliveredAt) throw new Error("Todavía no se registró la entrega.");
  const sections: Array<[string, string]> = [
    ["Cliente", order.customerName], ["Contacto", order.customerPhone],
    ["Equipo", `${order.deviceCategory} · ${order.deviceBrand ?? ''} ${order.deviceModel}`],
    ["Fecha de ingreso", formatDate(order.createdAt, true)], ["Estado de ingreso", statusLabels[order.initialStatus ?? order.events.at(-1)?.toStatus ?? order.status]],
    ["Falla declarada", order.reportedIssue], ["Estado físico al recibir", order.intakeCondition || "Sin observaciones registradas"], ["Accesorios recibidos", order.accessories || "Ninguno registrado"],
  ];
  if (order.intakeData) {
    const data = order.intakeData;
    sections.push(["SIM / SD", `SIM: ${data.sim === 'received' ? 'recibida' : 'no recibida'}; SD: ${data.sd === 'received' ? 'recibida' : 'no recibida'}`], ["Encendido / humedad / golpes", `${powerLabel[data.power]}; humedad: ${yesNo[data.moisture]}; golpes: ${yesNo[data.impact]}`]);
    sections.push(["Pruebas de recepción", Object.entries(data.checklist).map(([key,item]) => `${TESTS[key as keyof typeof TESTS]}: ${resultLabel[item.result]}${item.reason ? ` (${item.reason})` : ''}`).join("\n")]);
  } else sections.push(["Pruebas de recepción", "Orden anterior: sin checklist registrado."]);
  if (kind === "intake") sections.push(["Presupuesto / seña al ingresar", order.initialStatus ? `${formatMoney(order.initialEstimateCents)} / ${formatMoney(order.initialDepositCents)}` : "Orden anterior: importes originales no registrados."]);
  else sections.push(["Presupuesto vigente / seña de ingreso", `${formatMoney(order.estimateCents)} / ${formatMoney(order.initialDepositCents ?? order.depositCents)}`]);
  if (kind === "quote") sections.push(
    ["Fecha de emisión", formatDate(new Date(), true)],
    ["Trabajo presupuestado", order.proposedSolution || "Trabajo pendiente de detallar. No acredita autorización."],
    ["Total de presupuesto", formatMoney(order.estimateCents)],
    ["Seña y pagos registrados", `${formatMoney(order.depositCents)} + ${formatMoney(order.paidCents)}`],
    ["Saldo presupuestado", order.estimateCents === null ? "Sin presupuesto registrado" : formatMoney(String(Number(order.estimateCents) - Number(order.depositCents ?? 0) - Number(order.paidCents ?? 0)))],
    ["Autorización del presupuesto", "Este documento informa el presupuesto vigente al emitirlo. No acredita aceptación del trabajo ni de adicionales. La aceptación de recepción y diagnóstico no sustituye la autorización del presupuesto."]
  );
  if (kind === "delivery") sections.push(["Entrega registrada", `${formatDate(order.deliveredAt, true)} · Recibió: ${order.deliveredTo ?? 'Sin registrar'}`], ["Accesorios devueltos", order.deliveryAccessories || "Sin accesorios registrados"], ["Garantía comercial informada", order.warrantyUntil ? `Hasta ${formatDate(order.warrantyUntil)}. No limita los derechos legales aplicables.` : "Sin plazo comercial registrado. Se mantienen los derechos legales aplicables."]);
  return sections;
}
export async function buildReceipt(order: RepairOrder, base: string, kind: ReceiptKind) {
  const doc = await PDFDocument.create();
  doc.setTitle(`${order.workshopName} - ${kind === 'intake' ? 'Recepción' : kind === 'quote' ? 'Presupuesto' : 'Entrega'} #${order.orderNumber}`);
  doc.setAuthor(order.workshopName);
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(await readFile(path.join(process.cwd(), "public/brand/fonts/inter-latin-400-normal.woff")), { subset: true });
  const bold = await doc.embedFont(await readFile(path.join(process.cwd(), "public/brand/fonts/inter-latin-700-normal.woff")), { subset: true });

  const url = trackingUrl(order.publicToken, base);
  const qr = await doc.embedPng(await QRCode.toBuffer(url, { errorCorrectionLevel: 'M', margin: 4, width: 300 }));
  const ink = rgb(.07,.11,.15), accent = rgb(0,133/255,244/255);
  const margin = 42, width = 595.28, height = 841.89, usable = width - margin * 2;
  let page = doc.addPage([width,height]); let y = height - margin;
  function header() {

    page.drawText(order.workshopName, { x: margin + 78, y: height - 58, font: bold, size: 23, color: ink });
    page.drawText("Servicio tecnico de reparaciones", { x: margin + 78, y: height - 76, font: regular, size: 10, color: ink });
    page.drawLine({ start:{x:margin,y:height-111},end:{x:width-margin,y:height-111},color:accent,thickness:2 });
    y = height - 135;
  }
  function room(needed: number) { if (y - needed < 55) { page = doc.addPage([width,height]); header(); } }
  function safe(value: string) { return value.replace(/[\r\t]/g,' ').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/[–—]/g,'-').replace(/→/g,' a ').replace(/[^\x20-\x7e\xa0-\xff\n]/g,'?'); }
  function lines(value: string, size = 10) {
    const result: string[] = [];
    for (const paragraph of safe(value).split('\n')) {
      let line = '';
      for (const word of paragraph.split(/\s+/)) {
        if (regular.widthOfTextAtSize(`${line} ${word}`.trim(), size) <= usable) line = `${line} ${word}`.trim();
        else { if (line) result.push(line); line = ''; for (const character of word) { if (regular.widthOfTextAtSize(line+character,size) > usable) { result.push(line); line=''; } line += character; } }
      }
      result.push(line);
    }
    return result;
  }
  function paragraph(text: string, size = 10) { for (const line of lines(text,size)) { room(15); if (line) page.drawText(line,{x:margin,y,font:regular,size,color:ink}); y-=14; } y-=6; }
  function section(title: string, value: string) { room(42); page.drawText(safe(title),{x:margin,y,font:bold,size:10,color:ink});y-=17;paragraph(value); }
  function boxed(title: string, value: string, x: number, top: number, boxWidth: number, boxHeight: number, size = 9) {
    page.drawRectangle({x,y:top-boxHeight,width:boxWidth,height:boxHeight,borderColor:rgb(.72,.77,.82),borderWidth:.8});
    page.drawText(safe(title).toUpperCase(),{x:x+9,y:top-16,font:bold,size:7.5,color:accent});
    const maxWidth=boxWidth-18; let lineY=top-32;
    for(const paragraphText of safe(value).split('\n')) {
      let line='';
      for(const word of paragraphText.split(/\s+/)) {
        const candidate=`${line} ${word}`.trim();
        if(regular.widthOfTextAtSize(candidate,size)<=maxWidth) line=candidate;
        else { if(lineY>top-boxHeight+8&&line) page.drawText(line,{x:x+9,y:lineY,font:regular,size,color:ink}); lineY-=12; line=word; }
      }
      if(lineY>top-boxHeight+8&&line) page.drawText(line,{x:x+9,y:lineY,font:regular,size,color:ink});
      lineY-=12;
    }
  }
  header();
  if(kind === 'intake') {
    page.drawText(`ORDEN DE REPARACION #${order.orderNumber}`,{x:margin,y,font:bold,size:15,color:ink});
    page.drawText(`Ingreso: ${formatDate(order.createdAt,true)}`,{x:width-margin-155,y:y+1,font:regular,size:9,color:ink});
    page.drawText("COMPROBANTE DE RECEPCION - NO VALIDO COMO FACTURA",{x:margin,y:y-14,font:regular,size:7.5,color:accent});
    y-=34;
    boxed("Cliente",order.customerName,margin,y,usable*.62,52);
    boxed("Contacto",order.customerPhone,margin+usable*.62+8,y,usable*.38-8,52);
    y-=60;
    boxed("Equipo",`${order.deviceCategory} - ${order.deviceBrand ?? ''} ${order.deviceModel}`.trim(),margin,y,usable*.62,52);
    boxed("Encendido",order.intakeData ? powerLabel[order.intakeData.power] : "No comprobado",margin+usable*.62+8,y,usable*.38-8,52);
    y-=60;
    boxed("Falla declarada",order.reportedIssue,margin,y,usable,66);
    y-=74;
    boxed("Estado fisico al recibir",order.intakeCondition || "Sin observaciones registradas",margin,y,usable,66);
    y-=74;
    boxed("Accesorios recibidos",order.accessories || "Ninguno registrado",margin,y,usable*.58,58);
    const simSd=order.intakeData ? `SIM: ${order.intakeData.sim === 'received' ? 'recibida' : 'no recibida'} / SD: ${order.intakeData.sd === 'received' ? 'recibida' : 'no recibida'}` : "Sin registro";
    boxed("SIM / tarjeta SD",simSd,margin+usable*.58+8,y,usable*.42-8,58);
    y-=66;
    const intakeAmount=order.initialStatus ? formatMoney(order.initialEstimateCents) : "Sin presupuesto inicial";
    const intakeDeposit=order.initialStatus ? formatMoney(order.initialDepositCents) : "Sin registro";
    boxed("Presupuesto estimado",intakeAmount,margin,y,usable*.5-4,50,10);
    boxed("Sena recibida",intakeDeposit,margin+usable*.5+4,y,usable*.5-4,50,10);
    y-=64;
    page.drawImage(qr,{x:margin,y:y-104,width:104,height:104});
    page.drawText("SEGUIMIENTO DE LA REPARACION",{x:margin+120,y:y-20,font:bold,size:11,color:ink});
    page.drawText("Escanea el QR para consultar el estado actualizado.",{x:margin+120,y:y-40,font:regular,size:9,color:ink});
    page.drawText("El acceso es privado: no lo compartas fuera del titular.",{x:margin+120,y:y-56,font:regular,size:8.5,color:ink});
    const shortUrlLines=lines(url,7.5); let urlY=y-77;
    for(const line of shortUrlLines.slice(0,3)){page.drawText(line,{x:margin+120,y:urlY,font:regular,size:7.5,color:ink});urlY-=10;}
    page.drawText("La recepcion y el diagnostico no autorizan reparaciones ni borrado de datos.",{x:margin+120,y:y-96,font:regular,size:7.2,color:ink});
    page.drawText("Todo trabajo o importe adicional requiere aprobacion previa del cliente.",{x:margin+120,y:y-107,font:regular,size:7.2,color:ink});
    y-=124;
    page.drawLine({start:{x:margin,y},end:{x:width/2-18,y},color:ink,thickness:.5});
    page.drawLine({start:{x:width/2+18,y},end:{x:width-margin,y},color:ink,thickness:.5});
    page.drawText("Firma y aclaracion del cliente",{x:margin,y:y-14,font:regular,size:8.5,color:ink});
    page.drawText("Firma y aclaracion del taller",{x:width/2+18,y:y-14,font:regular,size:8.5,color:ink});
  } else {
    paragraph(`${kind === 'quote' ? 'PRESUPUESTO' : 'COMPROBANTE DE ENTREGA'} - ORDEN #${order.orderNumber}`, 15);
    for (const [title,value] of receiptSections(order,kind)) section(title,value);
    room(150); page.drawImage(qr,{x:margin,y:y-115,width:115,height:115});
    page.drawText("Segui el estado desde tu casa",{x:margin+130,y:y-25,font:bold,size:12,color:ink});
    page.drawText("El QR y el enlace son privados.",{x:margin+130,y:y-48,font:regular,size:10,color:ink});
    page.drawText("Compartilos solo con el titular del equipo.",{x:margin+130,y:y-66,font:regular,size:9,color:ink});y-=130;
    paragraph(url,8);
  }
  if(kind !== 'intake') {
    if (order.consent) {
      section("Aceptación registrada", `${order.consent.acceptedName} · ${formatDate(new Date(order.consent.acceptedAt),true)} · ${order.consent.method === 'typed_name' ? 'Nombre y aceptación expresos' : 'Firma en copia de papel registrada'} · Versión ${order.consent.version}`);
      section("Borrado / restauración (autorización separada)", order.consent.eraseAuthorized ? `Autorizado expresamente por ${order.consent.acceptedName} el ${formatDate(new Date(order.consent.eraseAcceptedAt!),true)}.` : "NO AUTORIZADO. La aceptación de recepción y diagnóstico no autoriza borrar o restaurar datos.");
      section("Condiciones aceptadas", order.consent.text);
    } else section("Condiciones", "Orden anterior sin consentimiento registrado. Este comprobante no acredita una aceptación retroactiva.");
    room(90);y-=25;page.drawLine({start:{x:margin,y},end:{x:width/2-20,y},color:ink,thickness:.5});page.drawLine({start:{x:width/2+20,y},end:{x:width-margin,y},color:ink,thickness:.5});y-=16;
    page.drawText("Firma / aclaración del cliente",{x:margin,y,font:regular,size:9,color:ink});page.drawText("Firma / aclaración del taller",{x:width/2+20,y,font:regular,size:9,color:ink});
  }
  doc.getPages().forEach((p,i) => p.drawText(`${order.workshopName} - Orden #${order.orderNumber} - ${i+1}/${doc.getPageCount()}`,{x:margin,y:26,font:regular,size:8,color:ink}));
  return { bytes: await doc.save(), url };
}

export async function buildIntakeLayout(order: RepairOrder, base: string, layout: IntakeLayout) {
  if (layout === "a4") return buildReceipt(order, base, "intake");
  const url = layout === "label" ? new URL(`/orders/${order.id}`,base).toString() : trackingUrl(order.publicToken, base);
  if (layout === "label") {
    const doc=await PDFDocument.create();const width=283.46,height=170.08;const page=doc.addPage([width,height]);
    doc.registerFontkit(fontkit);
    const regular=await doc.embedFont(await readFile(path.join(process.cwd(),"public/brand/fonts/inter-latin-400-normal.woff")),{subset:true});
    const bold=await doc.embedFont(await readFile(path.join(process.cwd(),"public/brand/fonts/inter-latin-700-normal.woff")),{subset:true});
    const fit=(value:string,size:number,font=regular,max=157)=>{let text=safeLabel(value,200);if(font.widthOfTextAtSize(text,size)<=max)return text;while(text&&font.widthOfTextAtSize(text+"...",size)>max)text=text.slice(0,-1);return text+"...";};
    const qr=await doc.embedPng(await QRCode.toBuffer(url,{errorCorrectionLevel:'M',margin:2,width:220}));
    page.drawText(fit(order.workshopName,17,bold,255),{x:14,y:143,font:bold,size:17,color:rgb(0,.52,.96)});
    page.drawText(`ORDEN #${order.orderNumber}`,{x:14,y:119,font:bold,size:18});
    page.drawText(fit(statusLabels[order.status],10,bold),{x:14,y:97,font:bold,size:10});
    page.drawText(fit(`${order.deviceBrand ?? ''} ${order.deviceModel}`.trim(),9),{x:14,y:79,font:regular,size:9});
    page.drawText(fit(order.reportedIssue,8),{x:14,y:61,font:regular,size:8});
    page.drawText(fit(order.locationName || "Sin ubicacion asignada",8,bold),{x:14,y:43,font:bold,size:8});
    page.drawText("Acceso interno: requiere sesion",{x:14,y:19,font:regular,size:7});
    page.drawImage(qr,{x:181,y:15,width:88,height:88});
    page.drawRectangle({x:5,y:5,width:width-10,height:height-10,borderWidth:1,borderColor:rgb(.35,.45,.55)});
    return {bytes:await doc.save(),url};
  }
  const sourceResult=await buildReceipt(order,base,"intake");const source=await PDFDocument.load(sourceResult.bytes);const doc=await PDFDocument.create();const embedded=await doc.embedPage(source.getPage(0));
  if(layout === "a5") {
    const width=419.53,height=595.28,page=doc.addPage([width,height]);const scale=Math.min((width-12)/embedded.width,(height-12)/embedded.height);
    page.drawPage(embedded,{x:(width-embedded.width*scale)/2,y:(height-embedded.height*scale)/2,xScale:scale,yScale:scale});
  } else {
    const width=841.89,height=595.28,page=doc.addPage([width,height]);const half=width/2;const scale=Math.min((half-12)/embedded.width,(height-12)/embedded.height);
    for(const offset of [0,half]) page.drawPage(embedded,{x:offset+(half-embedded.width*scale)/2,y:(height-embedded.height*scale)/2,xScale:scale,yScale:scale});
    page.drawLine({start:{x:half,y:0},end:{x:half,y:height},thickness:.6,color:rgb(.55,.6,.65),dashArray:[4,4]});
  }
  doc.setTitle(`${order.workshopName} - Orden #${order.orderNumber} - ${layout}`);doc.setAuthor(order.workshopName);
  return {bytes:await doc.save(),url};
}
function safeLabel(value:string,max:number){return value.replace(/[^\x20-\x7e\xa0-\xff]/g," ").slice(0,max);}

/** Customer allowlist. Intake is immutable; private diagnosis, parts costs, locations and access metadata are never included. */
export function cycleSections(order:RepairOrder):Array<[string,string]> {
 const sections:Array<[string,string]>=[
 ["Cliente / equipo",`${order.customerName} · ${order.customerPhone}\n${order.deviceCategory} · ${order.deviceBrand??""} ${order.deviceModel}`],
 ["Recepción original",`${formatDate(order.createdAt,true)} · ${order.initialStatus?statusLabels[order.initialStatus]:"Sin estado inicial registrado"}\nFalla: ${order.reportedIssue}\nEstado físico: ${order.intakeCondition||"Sin registrar"}\nAccesorios: ${order.accessories||"Sin registrar"}`],
 ["Pruebas iniciales",order.intakeData?Object.entries(order.intakeData.checklist).map(([key,item])=>`${TESTS[key as keyof typeof TESTS]||key}: ${resultLabel[item.result]}${item.reason?` · ${item.reason}`:""}`).join(" · "):"Orden anterior sin pruebas registradas."],
 ["Importes originales de ingreso",order.initialStatus?`Presupuesto: ${formatMoney(order.initialEstimateCents)} · Seña: ${formatMoney(order.initialDepositCents)}`:"Orden anterior: importes originales no registrados."],
 ["Diagnóstico / mensaje comunicado al cliente",order.publicSummary||"Sin diagnóstico público registrado. Las notas internas no se incluyen."],
 ["Trabajo informado al cliente",order.proposedSolution||"Sin trabajo informado. El diagnóstico interno no se incluye."],
 ["Presupuesto vigente / pagos registrados",`Presupuesto: ${formatMoney(order.estimateCents)} · Seña: ${formatMoney(order.depositCents)} · Pagos posteriores: ${formatMoney(order.paidCents)}\nSaldo estimado: ${order.estimateCents===null?"Sin presupuesto":formatMoney(String(BigInt(order.estimateCents)-BigInt(order.depositCents??"0")-BigInt(order.paidCents??"0")))}\nRespuesta al presupuesto: ${order.quoteDecision?(order.quoteDecision==="approved"?"Aprobado":"Rechazado"):"Sin respuesta pública registrada; consultar constancia del taller"}`],
 ["Pruebas finales",order.finalTests?Object.entries(order.finalTests.items).map(([key,item])=>`${checkLabels[key as keyof typeof checkLabels]||key}: ${checkResultLabels[item.result]}${item.reason?` · ${item.reason}`:""}`).join(" · "):"No registradas. No se presume funcionamiento."],
 ["Cierre y entrega",order.deliveredAt?`${formatDate(order.deliveredAt,true)} · Recibió: ${order.deliveredTo??"Sin registrar"}\nAccesorios devueltos: ${order.deliveryAccessories||"Sin registrar"}\nGarantía comercial: ${order.warrantyUntil?`hasta ${formatDate(order.warrantyUntil)}`:"sin plazo registrado"}. Se mantienen los derechos legales aplicables.`:"Entrega pendiente. Este documento no acredita retiro ni conformidad final."],
 ["Consentimiento de recepción",order.consent?`${order.consent.acceptedName} · ${formatDate(new Date(order.consent.acceptedAt),true)} · ${order.consent.method==="paper_signature"?"Firma en papel registrada":"Aceptación expresa registrada"} · Versión ${order.consent.version}. La recepción no autoriza reparaciones adicionales. Borrado/restauración: ${order.consent.eraseAuthorized?"autorizado por separado":"NO AUTORIZADO"}. Condiciones originales conservadas en la ficha de recepción.`:"Sin consentimiento histórico registrado; no se acredita aceptación retroactiva."],
 ];return sections;
}
export async function buildCycleReceipt(order:RepairOrder,base:string,layout:Exclude<IntakeLayout,"label">="a4") {
 const doc=await PDFDocument.create();doc.registerFontkit(fontkit);
 const regular=await doc.embedFont(await readFile(path.join(process.cwd(),"public/brand/fonts/inter-latin-400-normal.woff")),{subset:true});
 const bold=await doc.embedFont(await readFile(path.join(process.cwd(),"public/brand/fonts/inter-latin-700-normal.woff")),{subset:true});
 const url=trackingUrl(order.publicToken,base),qr=await doc.embedPng(await QRCode.toBuffer(url,{margin:4,width:300}));
 const width=layout==="a4"?595.28:419.53,height=layout==="a4"?841.89:595.28,margin=layout==="a4"?32:24,usable=width-margin*2,ink=rgb(.07,.12,.2),blue=rgb(.035,.32,.68);
 let page=doc.addPage([width,height]),y=0;
 function header(){page.drawText(safeLabel(order.workshopName,layout==="a4"?55:35),{x:margin,y:height-40,font:bold,size:16,color:blue});page.drawText(`ORDEN DE REPARACION #${order.orderNumber}`,{x:margin,y:height-64,font:bold,size:12,color:ink});page.drawText(`Estado actual: ${statusLabels[order.status]} · No valido como factura`,{x:margin,y:height-82,font:regular,size:9,color:ink});y=height-106;}
 function room(){if(y<margin+14){page=doc.addPage([width,height]);header();}}
 function wrap(value:string,font=regular,size=9){
  const lines:string[]=[];
  for(const paragraph of value.replace(/[\r\t]/g," ").split("\n")){
   let line="";
   for(const word of paragraph.split(/\s+/)){
    const candidate=line?line+" "+word:word;
    if(font.widthOfTextAtSize(candidate,size)<=usable){line=candidate;continue;}
    if(line)lines.push(line);line="";
    for(const char of word){if(font.widthOfTextAtSize(line+char,size)>usable){lines.push(line);line="";}line+=char;}
   }
   lines.push(line);
  }return lines;
 }
 header();
 for(const [title,value] of cycleSections(order)){
  if(y<margin+42){page=doc.addPage([width,height]);header();}
  page.drawLine({start:{x:margin,y:y+10},end:{x:width-margin,y:y+10},thickness:.5,color:rgb(.75,.8,.86)});
  page.drawText(title,{x:margin,y,font:bold,size:9,color:blue});y-=12;
  for(const line of wrap(value)){room();page.drawText(line,{x:margin,y,font:regular,size:9,color:ink});y-=11;}y-=6;
 }
 if(y<margin+112){page=doc.addPage([width,height]);header();}
 page.drawImage(qr,{x:margin,y:y-94,width:94,height:94});page.drawText("Seguimiento privado del cliente",{x:margin+108,y:y-20,font:bold,size:10,color:ink});page.drawText("No compartir el enlace ni el QR fuera del titular.",{x:margin+108,y:y-38,font:regular,size:9,color:ink});
 const signatureStart=margin+108,mid=(signatureStart+width-margin)/2;
 page.drawLine({start:{x:signatureStart,y:y-76},end:{x:mid-8,y:y-76},color:ink,thickness:.5});page.drawText("Cliente: conformidad y firma",{x:signatureStart,y:y-92,font:regular,size:8,color:ink});
 page.drawLine({start:{x:mid+8,y:y-76},end:{x:width-margin,y:y-76},color:ink,thickness:.5});page.drawText("Taller: firma y aclaracion",{x:mid+8,y:y-92,font:regular,size:8,color:ink});
 doc.getPages().forEach((p,i)=>p.drawText(`Orden #${order.orderNumber} · ${i+1}/${doc.getPageCount()}`,{x:margin,y:16,font:regular,size:8,color:ink}));
 doc.setTitle(`${order.workshopName} - Orden de reparación #${order.orderNumber}`);doc.setAuthor(order.workshopName);
 if(layout==="a4"||layout==="a5") return {bytes:await doc.save(),url};
 // Every page is preserved, including overflow; never silently crop the document to its first page.
 const compact=await PDFDocument.create();compact.setTitle(`${order.workshopName} - Orden #${order.orderNumber} - ${layout}`);compact.setAuthor(order.workshopName);
 const printable=await PDFDocument.load(await doc.save());
 for(const source of printable.getPages()){
  const embedded=await compact.embedPage(source);const w=841.89,h=595.28,p=compact.addPage([w,h]);const slot=w/2,scale=Math.min((slot-12)/width,(h-12)/height);
  for(const offset of [0,slot])p.drawPage(embedded,{x:offset+(slot-width*scale)/2,y:(h-height*scale)/2,xScale:scale,yScale:scale});
  if(layout==="double")p.drawLine({start:{x:slot,y:0},end:{x:slot,y:h},dashArray:[4,4],thickness:.5,color:ink});
 }
 return {bytes:await compact.save(),url};
}
