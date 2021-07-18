const charactors = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const charactorLength = 32;

export const imUlid = function () {
  let time = Date.now();
  let digit: number;
  let code = '';

  let i = 10;
  while (i--) {
    digit = time % charactorLength;
    code = charactors[digit] + code;
    time = (time - digit) / charactorLength;
  }

  const randomList = new Uint8Array(16);
  // eslint-disable-next-line
  // @ts-ignore
  ('crypto' in window ? crypto : msCrypto).getRandomValues(randomList);

  i = 16;
  while (i--) {
    code += charactors[randomList[i] & 31];
  }

  return code;
};
