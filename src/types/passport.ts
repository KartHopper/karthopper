/** Format d'échange du passeport (export/import + future migration compte V2). */
export interface PassportExport {
  schema_version: 1;
  exported_at: string; // ISO datetime
  visits: { circuit_id: number; marked_at: string }[];
}
