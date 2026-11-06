import { TESTS, type IntakeOrder } from '../src/lib/intake';
export function fixture(overrides: Partial<IntakeOrder> = {}): IntakeOrder {
  return { customerName: 'Cliente Ficticio QA', phone: '0000000000', email: '', category: 'Celular / Tablet', brand: 'Marca QA', model: 'Equipo de prueba', color: 'Negro', serialNumber: 'PRIVATE-IMEI-000', reportedIssue: 'No enciende después de una caída. Falla declarada por el cliente.', intakeCondition: 'Pantalla rota y marco golpeado.', accessories: 'Funda y cable USB', proposedSolution: '', estimateCents: '4500050', depositCents: '1000000', status: 'received',
    intake: { line: 'PRIVATE-LINE-000', sim: 'received', sd: 'not_received', power: 'off', moisture: 'unknown', impact: 'yes', checklist: Object.fromEntries(Object.keys(TESTS).map(key => [key, { result: 'not_tested', reason: 'El equipo no enciende.' }])) },
    estimatedCompletion: '', acceptedName: 'Cliente Ficticio QA', acceptanceMethod: 'typed_name', accepted: true, eraseAuthorized: false, ...overrides };
}
