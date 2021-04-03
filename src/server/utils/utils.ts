import { Config, Locales } from '../index';

export function _L(str: string): string {
  if (Locales === null) return `Locale '${Config.locale}' not Found`;

  if (typeof Locales[str] !== 'undefined') {
    return Locales[str];
  } else {
    return `Translation for '${str}' not Found`;
  }
}

export const debug = {
  log: (str: string) => {
    if (Config.debugMode >= 1) {
      console.log(str);
    }
  },
  verbose: (str: string) => {
    if (Config.debugMode >= 2) {
      console.log(str);
    }
  },
};

export function getRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let randomString = '';

  for (let i = 0; i < length; i += 1) {
    const charIndex = Math.floor(Math.random() * characters.length);

    randomString += characters.charAt(charIndex);
  }

  return randomString;
}
