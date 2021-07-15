const charactors = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const charactorLength = 32;

export const imUlid = function () {
  let time = Date.now();
  let digit: number;
  let code = '';

  let i = 10;
  while (i--) {
    digit = time % charactorLength;
    code = charactors.charAt(digit) + code;
    time = (time - digit) / charactorLength;
  }

  const randomList = new Uint8Array(15);
  // eslint-disable-next-line
  // @ts-ignore
  ('crypto' in window ? crypto : msCrypto).getRandomValues(randomList);

  i = 16;
  while (i--) {
    code += charactors.charAt(randomList[i] & (charactorLength - 1));
  }

  return code;
};
