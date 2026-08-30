export const APP_NAV = [
  { href: "/dashboard", label: "Home", short: "Home" },
  { href: "/journey", label: "Journey", short: "Path" },
  { href: "/transactions", label: "Money in & out", short: "Money" },
  { href: "/budget", label: "Budget", short: "Budget" },
  { href: "/goals", label: "Goals", short: "Goals" },
  { href: "/house", label: "House", short: "House" },
  { href: "/scenarios", label: "Compare", short: "Compare" },
  { href: "/simulator", label: "What if", short: "What if" },
  { href: "/net-worth", label: "Net worth", short: "Worth" },
  { href: "/debts", label: "Debts", short: "Debts" },
  { href: "/bills", label: "Bills", short: "Bills" },
  { href: "/household", label: "Household", short: "People" },
  { href: "/reports", label: "Reports", short: "Reports" },
  { href: "/settings", label: "Settings", short: "Settings" },
] as const;

export const MOBILE_NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/transactions", label: "Money" },
  { href: "/budget", label: "Budget" },
  { href: "/goals", label: "Goals" },
  { href: "/house", label: "House" },
] as const;
