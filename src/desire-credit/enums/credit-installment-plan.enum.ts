export enum CreditInstallmentPlan {
  TWO_WEEKS = 'TWO_WEEKS',
  FIFTEEN_DAYS = 'FIFTEEN_DAYS',
  FOUR_WEEKS = 'FOUR_WEEKS',
  ONE_MONTH = 'ONE_MONTH',
  SIX_WEEKS = 'SIX_WEEKS',
  ONE_AND_HALF_MONTHS = 'ONE_AND_HALF_MONTHS',
  EIGHT_WEEKS = 'EIGHT_WEEKS',
  TWO_MONTHS = 'TWO_MONTHS',
}

export const CREDIT_INSTALLMENT_PLAN_DAYS: Record<
  CreditInstallmentPlan,
  number
> = {
  [CreditInstallmentPlan.TWO_WEEKS]: 14,
  [CreditInstallmentPlan.FIFTEEN_DAYS]: 15,
  [CreditInstallmentPlan.FOUR_WEEKS]: 28,
  [CreditInstallmentPlan.ONE_MONTH]: 30,
  [CreditInstallmentPlan.SIX_WEEKS]: 42,
  [CreditInstallmentPlan.ONE_AND_HALF_MONTHS]: 45,
  [CreditInstallmentPlan.EIGHT_WEEKS]: 56,
  [CreditInstallmentPlan.TWO_MONTHS]: 60,
};

export const CREDIT_INSTALLMENT_PLAN_LABELS: Record<
  CreditInstallmentPlan,
  string
> = {
  [CreditInstallmentPlan.TWO_WEEKS]: '2 Weeks',
  [CreditInstallmentPlan.FIFTEEN_DAYS]: '15 Days',
  [CreditInstallmentPlan.FOUR_WEEKS]: '4 Weeks',
  [CreditInstallmentPlan.ONE_MONTH]: '1 Month',
  [CreditInstallmentPlan.SIX_WEEKS]: '6 Weeks',
  [CreditInstallmentPlan.ONE_AND_HALF_MONTHS]: '1½ Months',
  [CreditInstallmentPlan.EIGHT_WEEKS]: '8 Weeks',
  [CreditInstallmentPlan.TWO_MONTHS]: '2 Months',
};