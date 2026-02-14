export const ACCOUNT_TYPE_OPTIONS = [
  { value: "CASH", text: "CASH(현금)" },
  { value: "BANK", text: "BANK(은행)" },
  { value: "CARD", text: "CARD(카드)" },
  { value: "INVEST", text: "INVEST(투자계좌)" },
  { value: "ETC", text: "ETC(기타)" },
];

export const ACCOUNT_TYPE_VALUE_SET = new Set(ACCOUNT_TYPE_OPTIONS.map((item) => item.value));

export const ACCOUNT_TYPE_TEXT_MAP = Object.fromEntries(ACCOUNT_TYPE_OPTIONS.map((item) => [item.value, item.text]));

export const CURRENCY_CODE_OPTIONS = [
  { value: "KRW", text: "KRW(한국원)" },
  { value: "USD", text: "USD(미국달러)" },
  { value: "JPY", text: "JPY(일본엔)" },
  { value: "EUR", text: "EUR(유로)" },
  { value: "CNY", text: "CNY(중국위안)" },
  { value: "HKD", text: "HKD(홍콩달러)" },
  { value: "SGD", text: "SGD(싱가포르달러)" },
];

export const CURRENCY_CODE_VALUE_SET = new Set(CURRENCY_CODE_OPTIONS.map((item) => item.value));

export const CURRENCY_CODE_TEXT_MAP = Object.fromEntries(CURRENCY_CODE_OPTIONS.map((item) => [item.value, item.text]));
