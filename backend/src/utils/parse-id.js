import { HttpError } from './http-error.js';

export function parseId(value, name = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, `Invalid ${name}`);
  }
  return id;
}