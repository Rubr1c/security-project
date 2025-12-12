import { encrypt, decrypt } from './crypto';

export const USER_ENCRYPTED_FIELDS = ['name', 'email'] as const;
export const APPOINTMENT_ENCRYPTED_FIELDS = ['diagnosis'] as const;
export const MEDICATION_ENCRYPTED_FIELDS = ['name', 'instructions'] as const;

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

export function encryptUserFields<T extends EncryptableRecord>(record: T): T {
  return encryptFields(record, USER_ENCRYPTED_FIELDS as unknown as (keyof T)[]);
}

export function decryptUserFields<T extends EncryptableRecord>(record: T): T {
  return decryptFields(record, USER_ENCRYPTED_FIELDS as unknown as (keyof T)[]);
}

export function encryptAppointmentFields<T extends EncryptableRecord>(record: T): T {
  return encryptFields(record, APPOINTMENT_ENCRYPTED_FIELDS as unknown as (keyof T)[]);
}

export function decryptAppointmentFields<T extends EncryptableRecord>(record: T): T {
  return decryptFields(record, APPOINTMENT_ENCRYPTED_FIELDS as unknown as (keyof T)[]);
}

export function encryptMedicationFields<T extends EncryptableRecord>(record: T): T {
  return encryptFields(record, MEDICATION_ENCRYPTED_FIELDS as unknown as (keyof T)[]);
}

export function decryptMedicationFields<T extends EncryptableRecord>(record: T): T {
  return decryptFields(record, MEDICATION_ENCRYPTED_FIELDS as unknown as (keyof T)[]);
}

export function decryptUserRecords<T extends EncryptableRecord>(records: T[]): T[] {
  return records.map(decryptUserFields);
}

export function decryptAppointmentRecords<T extends EncryptableRecord>(records: T[]): T[] {
  return records.map(decryptAppointmentFields);
}

export function decryptMedicationRecords<T extends EncryptableRecord>(records: T[]): T[] {
  return records.map(decryptMedicationFields);
}
