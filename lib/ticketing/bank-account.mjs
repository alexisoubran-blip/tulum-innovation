// LGM's account for SPEI and international transfers (shared by LGM on 2026-10-19). These are the
// details every buyer sees to pay; Vercel env vars with the same names override them.
export const LGM_BANK_ENV = {
  BANK_TRANSFER_BENEFICIARY: 'LIKE GROUP MANAGEMENT S.A.P.I. DE C.V.',
  BANK_TRANSFER_BANK: 'Citibanamex',
  BANK_TRANSFER_CLABE: '002694004900504773',
  BANK_TRANSFER_ACCOUNT: '504773',
  BANK_TRANSFER_BRANCH: '0049',
  BANK_TRANSFER_SWIFT: 'BNMXMXMM',
  BANK_TRANSFER_ABA: '021000089',
};

// CLABE control digit (Banxico): weights 3-7-1 over the first 17 digits.
export function clabeIsValid(clabe) {
  if (!/^\d{18}$/.test(clabe)) return false;
  const w = [3, 7, 1];
  const sum = [...clabe.slice(0, 17)].reduce((s, d, i) => s + ((Number(d) * w[i % 3]) % 10), 0);
  return (10 - (sum % 10)) % 10 === Number(clabe[17]);
}
