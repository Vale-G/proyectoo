import { z } from "zod";

export const TESTS = { power: "Encendido", display: "Pantalla / imagen", charge: "Carga / alimentación", buttons: "Botones / controles", sound: "Audio", network: "Conectividad", cameras: "Cámaras" } as const;
export const TERMS_VERSION = "omnifix-2026-10-30-draft-1";
export const TERMS_REVIEWED = false;
export const SERVICE_TERMS = [
  "Borrador sujeto a revisión jurídica local antes de su uso comercial.",
  "Recepción y diagnóstico: se registran la falla declarada, el estado visible, los accesorios y las pruebas. Si el equipo no enciende o una prueba no puede realizarse, se deja constancia del motivo. Las fallas internas o preexistentes pueden conocerse recién durante el diagnóstico y se comunicarán al cliente.",
  "Alcance autorizado: la aceptación permite la revisión y el diagnóstico acordados. La reparación, el presupuesto y cualquier trabajo adicional requieren aprobación específica del cliente, con constancia del importe y del medio de aprobación. No se presume esa autorización por la sola recepción del equipo.",
  "Datos y privacidad: se recomienda una copia de seguridad previa cuando sea posible. No se solicitan contraseñas de cuentas ni se almacenan PIN o patrones. Se prefiere desbloqueo presencial. El tratamiento de datos y las fotografías privadas se limita al diagnóstico, reparación y constancia de recepción.",
  "Borrado o restauración: requieren autorización separada y expresa. No se consideran autorizados por aceptar estas condiciones ni por entregar un dispositivo que no enciende. Se informarán previamente las consecuencias sobre los datos.",
  "Presupuesto y repuestos: se informarán el trabajo propuesto, repuestos, precio, seña y plazo estimado. Si aparecen daños por golpes, humedad u otras fallas ocultas, se solicitará aprobación antes de ampliar el trabajo o el precio.",
  "Garantía: se entregará la constancia del trabajo y sus condiciones, respetando las garantías y los derechos que resulten aplicables conforme a la Ley 24.240 y demás normativa. Un plazo comercial informado no reduce los derechos legales. Las observaciones de ingreso no eximen al taller por una actuación negligente propia.",
  "Retiro y entrega: se coordinará el retiro al finalizar el trabajo, se identificarán la persona que recibe y los accesorios devueltos, y se registrará la fecha de entrega. No se presume abandono del equipo ni se autoriza su disposición por el mero transcurso del tiempo. Cualquier condición de guarda debe informarse y acordarse conforme a la normativa aplicable.",
].join("\n\n");

const text = (length: number) => z.string().trim().max(length);
export const checklistSchema = z.record(z.string(), z.object({ result: z.enum(["passed", "failed", "not_tested"]), reason: text(300) })).superRefine((items, ctx) => {
  for (const key of Object.keys(TESTS)) {
    const item = items[key];
    if (!item || (item.result === "not_tested" && !item.reason)) ctx.addIssue({ code: "custom", message: `Registrá el motivo de la prueba no realizada: ${TESTS[key as keyof typeof TESTS]}.` });
  }
  if (Object.keys(items).some(key => !(key in TESTS))) ctx.addIssue({ code: "custom", message: "Checklist desconocido." });
});
export const intakeSchema = z.object({
  line: text(40).default(""), sim: z.enum(["not_received", "received"]), sd: z.enum(["not_received", "received"]),
  power: z.enum(["on", "off", "unknown"]), moisture: z.enum(["yes", "no", "unknown"]), impact: z.enum(["yes", "no", "unknown"]),
  checklist: checklistSchema,
});
export const intakeOrderSchema = z.object({
  customerName: text(160).min(1, "Ingresá el nombre del cliente."), phone: text(32).min(1, "Ingresá un teléfono de contacto."),
  email: z.union([z.email().max(254), z.literal("")]).default(""), category: z.enum(["Celular / Tablet", "Consola / Joystick", "Notebook / PC", "TV / Monitor", "Otro equipo electrónico"]),
  brand: text(80).default(""), model: text(120).min(1, "Ingresá el modelo."), color: text(48).default(""), serialNumber: text(128).default(""),
  reportedIssue: text(2000).min(1, "Describí la falla declarada."), intakeCondition: text(2000).default(""), accessories: text(1000).default(""), proposedSolution: text(2000).default(""),
  estimateCents: z.string().regex(/^\d{1,12}$/).nullable(), depositCents: z.string().regex(/^\d{1,12}$/).nullable(),
  status: z.enum(["received", "diagnosing", "awaiting_approval", "awaiting_part", "under_warranty"]), intake: intakeSchema,
  estimatedCompletion: z.union([z.literal(""), z.iso.date()]).default(""),
  acceptedName: text(160).min(1, "Registrá quién acepta las condiciones."), acceptanceMethod: z.enum(["typed_name", "paper_signature"]),
  accepted: z.literal(true, { error: "Se requiere la aceptación de las condiciones." }), eraseAuthorized: z.boolean(),
});
export type IntakeOrder = z.infer<typeof intakeOrderSchema>;
export type IntakeData = z.infer<typeof intakeSchema>;
export type Consent = { version: string; text: string; acceptedAt: string; acceptedName: string; method: "typed_name" | "paper_signature"; eraseAuthorized: boolean; eraseAcceptedAt: string | null };

export class UserInputError extends Error {}

export function moneyToCents(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^\d{1,10}(?:[.,]\d{1,2})?$/.test(normalized)) throw new UserInputError("Ingresá importes positivos sin separadores de miles, por ejemplo 45000,50.");
  const [whole, decimals = ""] = normalized.split(/[.,]/);
  return String(BigInt(whole) * 100n + BigInt(decimals.padEnd(2, "0")));
}
export function parseIntake(form: FormData): IntakeOrder {
  const value = (name: string) => { const entry = form.get(name); return typeof entry === "string" ? entry : ""; };
  return intakeOrderSchema.parse({
    ...Object.fromEntries(["customerName", "phone", "email", "category", "brand", "model", "color", "serialNumber", "reportedIssue", "intakeCondition", "accessories", "proposedSolution", "status", "acceptedName", "acceptanceMethod", "estimatedCompletion"].map(key => [key, value(key)])),
    estimateCents: moneyToCents(value("estimate")), depositCents: moneyToCents(value("deposit")), accepted: form.get("accepted") === "on", eraseAuthorized: form.get("eraseAuthorized") === "on",
    intake: { line: value("line"), sim: value("sim"), sd: value("sd"), power: value("power"), moisture: value("moisture"), impact: value("impact"), checklist: Object.fromEntries(Object.keys(TESTS).map(key => [key, { result: value(`test_${key}`), reason: value(`reason_${key}`) }])) },
  });
}
export function validationMessage(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Revisá los campos.";
  return error instanceof UserInputError ? error.message : "No se pudo guardar. La operación no se confirmó. Volvé a intentar o recargá la página.";
}
