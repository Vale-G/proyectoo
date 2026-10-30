import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RepairOrder } from "./repair-store";
import { formatDate, formatMoney } from "./format";
import { statusLabels } from "./status";
import { TESTS } from "./intake";
import { trackingUrl } from "./tracking-url";

export type ReceiptKind = "intake" | "delivery";
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
  if (kind === "delivery") sections.push(["Entrega registrada", `${formatDate(order.deliveredAt, true)} · Recibió: ${order.deliveredTo ?? 'Sin registrar'}`], ["Accesorios devueltos", order.deliveryAccessories || "Sin accesorios registrados"], ["Garantía comercial informada", order.warrantyUntil ? `Hasta ${formatDate(order.warrantyUntil)}. No limita los derechos legales aplicables.` : "Sin plazo comercial registrado. Se mantienen los derechos legales aplicables."]);
  return sections;
}
export async function buildReceipt(order: RepairOrder, base: string, kind: ReceiptKind) {
  const doc = await PDFDocument.create();
  doc.setTitle(`OmniFix - ${kind === 'intake' ? 'Recepción' : 'Entrega'} #${order.orderNumber}`);
  doc.setAuthor("OmniFix");
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(await readFile(path.join(process.cwd(), "public/brand/fonts/inter-latin-400-normal.woff")), { subset: true });
  const bold = await doc.embedFont(await readFile(path.join(process.cwd(), "public/brand/fonts/inter-latin-700-normal.woff")), { subset: true });
  const logo = await doc.embedJpg(await readFile(path.join(process.cwd(), "public/brand/omnifix-original.jpg")));
  const url = trackingUrl(order.publicToken, base);
  const qr = await doc.embedPng(await QRCode.toBuffer(url, { errorCorrectionLevel: 'M', margin: 4, width: 300 }));
  const ink = rgb(.07,.11,.15), accent = rgb(0,133/255,244/255);
  const margin = 42, width = 595.28, height = 841.89, usable = width - margin * 2;
  let page = doc.addPage([width,height]); let y = height - margin;
  function header() {
    page.drawImage(logo, { x: margin, y: height - 100, width: 64, height: 64 });
    page.drawText("OmniFix", { x: margin + 78, y: height - 58, font: bold, size: 23, color: ink });
    page.drawText("Tecnologia en buenas manos", { x: margin + 78, y: height - 76, font: regular, size: 10, color: ink });
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
  header(); paragraph(`COMPROBANTE DE ${kind === 'intake' ? 'INGRESO' : 'ENTREGA'} - ORDEN #${order.orderNumber}`, 15);
  for (const [title,value] of receiptSections(order,kind)) section(title,value);
  room(150); page.drawImage(qr,{x:margin,y:y-115,width:115,height:115});
  page.drawText("Segui el estado desde tu casa",{x:margin+130,y:y-25,font:bold,size:12,color:ink});
  page.drawText("El QR y el enlace son privados.",{x:margin+130,y:y-48,font:regular,size:10,color:ink});
  page.drawText("Compartilos solo con el titular del equipo.",{x:margin+130,y:y-66,font:regular,size:9,color:ink});y-=130;
  paragraph(url,8);
  if (order.consent) {
    section("Aceptación registrada", `${order.consent.acceptedName} · ${formatDate(new Date(order.consent.acceptedAt),true)} · ${order.consent.method === 'typed_name' ? 'Nombre y aceptación expresos' : 'Firma en copia de papel registrada'} · Versión ${order.consent.version}`);
    section("Borrado / restauración (autorización separada)", order.consent.eraseAuthorized ? `Autorizado expresamente por ${order.consent.acceptedName} el ${formatDate(new Date(order.consent.eraseAcceptedAt!),true)}.` : "NO AUTORIZADO. La aceptación de recepción y diagnóstico no autoriza borrar o restaurar datos.");
    section("Condiciones aceptadas", order.consent.text);
  } else section("Condiciones", "Orden anterior sin consentimiento registrado. Este comprobante no acredita una aceptación retroactiva.");
  room(90);y-=25;page.drawLine({start:{x:margin,y},end:{x:width/2-20,y},color:ink,thickness:.5});page.drawLine({start:{x:width/2+20,y},end:{x:width-margin,y},color:ink,thickness:.5});y-=16;
  page.drawText("Firma / aclaración del cliente",{x:margin,y,font:regular,size:9,color:ink});page.drawText("Firma / aclaración de OmniFix",{x:width/2+20,y,font:regular,size:9,color:ink});
  doc.getPages().forEach((p,i) => p.drawText(`OmniFix - Orden #${order.orderNumber} - ${i+1}/${doc.getPageCount()}`,{x:margin,y:26,font:regular,size:8,color:ink}));
  return { bytes: await doc.save(), url };
}
