import { z } from "zod";
import { TESTS } from "./intake";
export const checkLabels = {...TESTS, keyboard:"Teclado", touchpad:"Touchpad", ports:"Puertos", storage:"Almacenamiento", temperature:"Temperaturas", cooling:"Ventilación", disc:"Lectura de discos", sticks:"Sticks / drift", triggers:"Gatillos", vibration:"Vibración", battery:"Batería", touch:"Táctil", bluetooth:"Bluetooth", sensors:"Sensores", microphones:"Micrófonos"};
export const checkResultLabels = {passed:"Funciona", failed:"Presenta falla", not_tested:"No realizada", not_applicable:"No aplica"};
export function categoryChecks(category:string,_model="") {
 if(category==="Celular / Tablet") return ["power","display","touch","charge","battery","cameras","microphones","sound","network","bluetooth","sensors","buttons"];
 if(category==="Notebook / PC") return ["power","display","keyboard","touchpad","ports","storage","temperature","cooling","network"];
 const controller=["sticks","buttons","triggers","vibration","battery","charge","network"],consoleChecks=["power","display","sound","temperature","cooling","disc","network","buttons"];
 if(category==="Joystick") return controller;
 if(category==="Consola") return consoleChecks;
 // Legacy combined category is ambiguous: keep both sets and require explicit N/A reasons, never guess from a model name.
 if(category==="Consola / Joystick") return [...new Set([...consoleChecks,...controller])];
 void _model;
 return Object.keys(TESTS);
}
export const finalChecksSchema=z.object({items:z.record(z.string(),z.object({result:z.enum(["passed","failed","not_tested","not_applicable"]),reason:z.string().trim().max(300)})),recordedAt:z.iso.datetime()});
export type FinalChecks=z.infer<typeof finalChecksSchema>;
export function validateFinalChecks(raw:unknown,category:string,model:string) {
 const value=finalChecksSchema.parse(raw);const keys=categoryChecks(category,model);
 if(keys.length!==Object.keys(value.items).length||keys.some(key=>!value.items[key])) throw new Error("Checklist incompatible con el equipo.");
 for(const item of Object.values(value.items)) if((item.result==="not_tested"||item.result==="not_applicable")&&!item.reason) throw new Error("Registrá el motivo de las pruebas no realizadas o no aplicables.");
 return value;
}
