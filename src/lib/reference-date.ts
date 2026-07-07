/** Date "aujourd'hui" pilotable pour la recette sur seed périmé (voir PLAN_V1 D2). */
export function getReferenceDate(): string {
  const override = process.env.NEXT_PUBLIC_REFERENCE_DATE;
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
  return new Date().toISOString().slice(0, 10);
}
