export type Id = number;
/** ISO 8601 timestamptz 문자열 */
export type Timestamp = string;
/** YYYY-MM-DD */
export type DateOnly = string;

export interface Auditable {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}
