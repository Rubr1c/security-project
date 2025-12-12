import { encrypt, decrypt } from './crypto';

export const USER_ENCRYPTED_FIELDS = ['name', 'email'] as const;
export const APPOINTMENT_ENCRYPTED_FIELDS = ['diagnosis'] as const;
export const MEDICATION_ENCRYPTED_FIELDS = ['name', 'instructions', 'dosage'] as const;

type UserFields = { name?: unknown; email?: unknown; [key: string]: unknown };
type AppointmentFields = { diagnosis?: unknown; [key: string]: unknown };
type MedicationFields = { name?: unknown; instructions?: unknown; dosage?: unknown; [key: string]: unknown };


type EncryptableRecord = Record<string, unknown>;

export function encryptFields<T extends EncryptableRecord>(
  record: T,
  fieldsToEncrypt: readonly (keyof T)[]
): T {
  const result = { ...record };

  for (const field of fieldsToEncrypt) {
    const value = record[field];
    if (typeof value === 'string' && value) {
      (result as EncryptableRecord)[field as string] = encrypt(value);
    }
  }

  return result;
}

export function decryptFields<T extends EncryptableRecord>(
  record: T,
  fieldsToDecrypt: readonly (keyof T)[]
): T {
  const result = { ...record };

  for (const field of fieldsToDecrypt) {
    const value = record[field];
    if (typeof value === 'string' && value) {
      (result as EncryptableRecord)[field as string] = decrypt(value);
    }
  }

  return result;
}

export function encryptUserFields<T extends UserFields>(record: T): T {
  return encryptFields(record, USER_ENCRYPTED_FIELDS);
}


export function decryptUserFields<T extends UserFields>(record: T): T {
  return decryptFields(record, USER_ENCRYPTED_FIELDS);
}


export function encryptAppointmentFields<T extends AppointmentFields>(
  record: T
): T {
  return encryptFields(
    record,
    APPOINTMENT_ENCRYPTED_FIELDS
  );
}

export function decryptAppointmentFields<T extends AppointmentFields>(
  record: T
): T {
  return decryptFields(
    record,
    APPOINTMENT_ENCRYPTED_FIELDS
  );
}

export function encryptMedicationFields<T extends MedicationFields>(
  record: T
): T {
  return encryptFields(
    record,
    MEDICATION_ENCRYPTED_FIELDS
  );
}

export function decryptMedicationFields<T extends MedicationFields>(
  record: T
): T {
  return decryptFields(
    record,
    MEDICATION_ENCRYPTED_FIELDS
  );
}

export function decryptUserRecords<T extends UserFields, K extends keyof T>(
  records: T[],
  allowedFields: readonly K[]
): Pick<T, K>[] {
  return records.map((record) => {
    const decrypted = decryptUserFields(record);
    const sanitized = {} as Pick<T, K>;
    for (const field of allowedFields) {
      sanitized[field] = decrypted[field] as Pick<T, K>[K];
    }
    return sanitized;
  });
}

export function decryptAppointmentRecords<T extends EncryptableRecord>(
  records: T[]
): T[] {
  return records.map(decryptAppointmentFields);
}

export function decryptMedicationRecords<T extends EncryptableRecord>(
  records: T[]
): T[] {
  return records.map(decryptMedicationFields);
}
