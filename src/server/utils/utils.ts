import { Config, Locales } from '../index';

const ResourceName = GetCurrentResourceName();

export function _L(str: string): string {
  if (Locales === null) return `Locale '${Config.locale}' not Found`;

  if (typeof Locales[str] !== 'undefined') {
    return Locales[str];
  } else {
    return `Translation for '${str}' not Found`;
  }
}

export async function debug(str: string): Promise<void> {
  if (!Config.enableDebugMode) return;

  console.log(`[${ResourceName}] ${str}`);
}

export function getRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let randomString = '';

  for (let i = 0; i < length; i += 1) {
    const charIndex = Math.floor(Math.random() * characters.length);

    randomString += characters.charAt(charIndex);
  }

  return randomString;
}
