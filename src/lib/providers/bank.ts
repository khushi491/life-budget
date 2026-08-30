export type BankTransaction = {
  externalId: string;
  amountMinor: bigint;
  date: string;
  merchant: string;
  description: string;
  pending: boolean;
};

export interface BankImportProvider {
  id: string;
  label: string;
  importRecent(accountExternalId: string): Promise<BankTransaction[]>;
}

export class MockBankImportProvider implements BankImportProvider {
  id = "mock-bank";
  label = "Demo bank import";

  async importRecent(accountExternalId: string): Promise<BankTransaction[]> {
    const today = new Date().toISOString().slice(0, 10);
    return [
      {
        externalId: `${accountExternalId}-demo-1`,
        amountMinor: -1850n,
        date: today,
        merchant: "Harbor Grocer",
        description: "Mock imported grocery purchase",
        pending: false,
      },
      {
        externalId: `${accountExternalId}-demo-2`,
        amountMinor: 420000n,
        date: today,
        merchant: "Northwind Payroll",
        description: "Mock imported paycheck",
        pending: false,
      },
    ];
  }
}

export const bankImportProvider: BankImportProvider =
  new MockBankImportProvider();
