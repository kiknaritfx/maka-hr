/**
 * คำนวณภาษีหัก ณ ที่จ่าย ตามสูตรกรมสรรพากร มาตรา 40(1)
 * สมมติฐาน: โสด / ลดหย่อนส่วนตัว 60,000 / ปกส. สูงสุด 9,000/ปี
 */
const BRACKETS = [150000,300000,500000,750000,1000000,2000000,5000000,Infinity];
const RATES    = [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35];

export function calcWHT(monthlyBase: number, ssoMonthly = 750): number {
  if (!monthlyBase || monthlyBase <= 0) return 0;
  const annual    = monthlyBase * 12;
  const expense   = Math.min(annual * 0.5, 100000);
  const personal  = 60000;
  const ssoDeduct = Math.min(ssoMonthly * 12, 9000);
  const net       = annual - expense - personal - ssoDeduct;
  if (net <= 0) return 0;

  let tax = 0, prev = 0;
  for (let i = 0; i < BRACKETS.length; i++) {
    if (net <= prev) break;
    tax += (Math.min(net, BRACKETS[i]) - prev) * RATES[i];
    prev = BRACKETS[i];
  }
  return Math.round(tax / 12);
}

export function calcSSO(monthlyBase: number): number {
  return Math.min(Math.floor(monthlyBase * 0.05), 750);
}
