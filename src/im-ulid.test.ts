import {describe, it, expect, vi, afterEach} from 'vitest';
import {imUlid} from './im-ulid';

/**
 * imUlid は ULID 仕様準拠ではなく独自の 26 文字 base32 表現:
 *   - 先頭 10 文字: Date.now() を 32 進で表現した時刻部
 *   - 後半 16 文字: crypto.getRandomValues で生成したランダム部
 *   - 使用文字: '0123456789ABCDEFGHJKMNPQRSTVWXYZ' (Crockford 風、I/L/O/U を除外)
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ALPHABET_RE = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/;

describe('imUlid', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('出力フォーマット', () => {
    it('26 文字の文字列を返す', () => {
      const ulid = imUlid();
      expect(typeof ulid).toBe('string');
      expect(ulid).toHaveLength(26);
    });

    it('使用文字は全て Crockford 風アルファベット (I/L/O/U 除外) のみ', () => {
      // 100 回試行しても disallowed char が混入しないことを確認
      for (let i = 0; i < 100; i++) {
        const ulid = imUlid();
        expect(ulid).toMatch(ALPHABET_RE);
      }
    });

    it('I/L/O/U は出力に含まれない', () => {
      for (let i = 0; i < 100; i++) {
        const ulid = imUlid();
        expect(ulid).not.toMatch(/[ILOU]/);
      }
    });
  });

  describe('時刻部 (先頭 10 文字)', () => {
    it('同一時刻で生成した値の時刻部は一致する', () => {
      const now = 1750000000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);
      const a = imUlid().slice(0, 10);
      const b = imUlid().slice(0, 10);
      expect(a).toBe(b);
    });

    it('時刻が進むと辞書順で大きくなる (monotonicity)', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
      const earlier = imUlid().slice(0, 10);
      vi.spyOn(Date, 'now').mockReturnValue(1800000000000);
      const later = imUlid().slice(0, 10);
      expect(later > earlier).toBe(true);
    });

    it('既知の時刻から既知のエンコード結果が出る (32進エンコード検算)', () => {
      // Date.now() === 0 のとき、time = 0 のループは "0000000000" を返す
      vi.spyOn(Date, 'now').mockReturnValue(0);
      expect(imUlid().slice(0, 10)).toBe('0000000000');

      // Date.now() === 31 のとき、最下位桁が 'Z' (alphabet[31])
      vi.spyOn(Date, 'now').mockReturnValue(31);
      expect(imUlid().slice(0, 10)).toBe('000000000' + 'Z');

      // Date.now() === 32 のとき、繰り上がりで "00000000010"
      vi.spyOn(Date, 'now').mockReturnValue(32);
      expect(imUlid().slice(0, 10)).toBe('00000000' + '10');
    });

    it('時刻部を 32 進文字列として逆変換すると元の Date.now() に戻る', () => {
      const cases = [0, 1, 31, 32, 1234567890, Date.UTC(2024, 0, 1)];
      for (const t of cases) {
        vi.spyOn(Date, 'now').mockReturnValue(t);
        const ulid = imUlid();
        const timePart = ulid.slice(0, 10);
        // 32 進数として decode
        let decoded = 0;
        for (const ch of timePart) {
          decoded = decoded * 32 + ALPHABET.indexOf(ch);
        }
        expect(decoded).toBe(t);
      }
    });
  });

  describe('ランダム部 (末尾 16 文字)', () => {
    it('同一時刻でも 2 回呼ぶとランダム部は (ほぼ確実に) 異なる', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1750000000000);
      const a = imUlid().slice(10);
      const b = imUlid().slice(10);
      // 32^16 通りあるので衝突確率は無視できる
      expect(a).not.toBe(b);
    });

    it('crypto.getRandomValues が呼び出される', () => {
      const spy = vi.spyOn(crypto, 'getRandomValues');
      imUlid();
      expect(spy).toHaveBeenCalledTimes(1);
      const arg = spy.mock.calls[0][0] as Uint8Array;
      expect(arg).toBeInstanceOf(Uint8Array);
      expect(arg.length).toBe(16);
    });

    it('getRandomValues の戻り値を反映する (alphabet[byte & 31])', () => {
      // 全要素 0 にすると charactors[0 & 31] = "0" が 16 文字続く
      vi.spyOn(crypto, 'getRandomValues').mockImplementation(arr => {
        if (arr) (arr as Uint8Array).fill(0);
        return arr;
      });
      vi.spyOn(Date, 'now').mockReturnValue(0);
      expect(imUlid()).toBe('0'.repeat(26));
    });

    it('byte 値の下位 5bit のみが採用される (byte & 31)', () => {
      // 32 (0b100000) は & 31 で 0 になるので "0" になる
      vi.spyOn(crypto, 'getRandomValues').mockImplementation(arr => {
        if (arr) (arr as Uint8Array).fill(32);
        return arr;
      });
      vi.spyOn(Date, 'now').mockReturnValue(0);
      expect(imUlid().slice(10)).toBe('0'.repeat(16));

      // 31 (0b11111) は & 31 で 31 → "Z"
      vi.spyOn(crypto, 'getRandomValues').mockImplementation(arr => {
        if (arr) (arr as Uint8Array).fill(31);
        return arr;
      });
      expect(imUlid().slice(10)).toBe('Z'.repeat(16));
    });
  });

  describe('多重呼び出し', () => {
    it('100 回連続で例外を出さずに動作する', () => {
      expect(() => {
        for (let i = 0; i < 100; i++) imUlid();
      }).not.toThrow();
    });

    it('生成された 100 個の ulid は全てユニーク', () => {
      const set = new Set<string>();
      for (let i = 0; i < 100; i++) set.add(imUlid());
      expect(set.size).toBe(100);
    });
  });

  describe('msCrypto フォールバック (legacy IE)', () => {
    it('window.crypto が無い環境では msCrypto を使う', () => {
      const originalCrypto = window.crypto;
      const fakeGetRandomValues = vi.fn((arr: Uint8Array) => {
        arr.fill(0);
        return arr;
      });
      // window.crypto を削除し、msCrypto をグローバルに定義
      // @ts-expect-error - jsdom の crypto を一時的に外す
      delete window.crypto;
      // @ts-expect-error - msCrypto は IE 用フォールバック (型は global に存在しない)
      (window as unknown as Record<string, unknown>).msCrypto = {
        getRandomValues: fakeGetRandomValues,
      };
      try {
        vi.spyOn(Date, 'now').mockReturnValue(0);
        const ulid = imUlid();
        expect(fakeGetRandomValues).toHaveBeenCalledTimes(1);
        expect(ulid).toBe('0'.repeat(26));
      } finally {
        // 後続テストのために crypto を戻して msCrypto を片付ける
        Object.defineProperty(window, 'crypto', {
          configurable: true,
          value: originalCrypto,
        });
        // @ts-expect-error - 後片付け
        delete (window as unknown as Record<string, unknown>).msCrypto;
      }
    });
  });
});
