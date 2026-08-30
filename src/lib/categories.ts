export type CategorySeed = {
  name: string;
  group:
    | "INCOME"
    | "HOUSING"
    | "ESSENTIAL"
    | "LIFESTYLE"
    | "DEBT"
    | "SAVINGS"
    | "TRANSFER";
  icon: string;
  color: string;
};

export const SYSTEM_CATEGORIES: CategorySeed[] = [
  { name: "Paycheck", group: "INCOME", icon: "Wallet", color: "#0f766e" },
  { name: "Bonus", group: "INCOME", icon: "Sparkles", color: "#0f766e" },
  {
    name: "Other income",
    group: "INCOME",
    icon: "PlusCircle",
    color: "#0f766e",
  },
  { name: "Rent", group: "HOUSING", icon: "Home", color: "#1d4ed8" },
  {
    name: "Mortgage / EMI",
    group: "HOUSING",
    icon: "Landmark",
    color: "#1d4ed8",
  },
  { name: "Utilities", group: "HOUSING", icon: "Zap", color: "#1d4ed8" },
  {
    name: "Home maintenance",
    group: "HOUSING",
    icon: "Wrench",
    color: "#1d4ed8",
  },
  {
    name: "Groceries",
    group: "ESSENTIAL",
    icon: "ShoppingCart",
    color: "#0f766e",
  },
  { name: "Transit", group: "ESSENTIAL", icon: "Bus", color: "#0f766e" },
  { name: "Insurance", group: "ESSENTIAL", icon: "Shield", color: "#0f766e" },
  { name: "Medical", group: "ESSENTIAL", icon: "HeartPulse", color: "#0f766e" },
  { name: "Childcare", group: "ESSENTIAL", icon: "Baby", color: "#0f766e" },
  {
    name: "Education",
    group: "ESSENTIAL",
    icon: "GraduationCap",
    color: "#0f766e",
  },
  { name: "Dining", group: "LIFESTYLE", icon: "Utensils", color: "#b45309" },
  {
    name: "Entertainment",
    group: "LIFESTYLE",
    icon: "Clapperboard",
    color: "#b45309",
  },
  {
    name: "Shopping",
    group: "LIFESTYLE",
    icon: "ShoppingBag",
    color: "#b45309",
  },
  { name: "Travel", group: "LIFESTYLE", icon: "Plane", color: "#b45309" },
  { name: "Personal", group: "LIFESTYLE", icon: "User", color: "#b45309" },
  { name: "Credit cards", group: "DEBT", icon: "CreditCard", color: "#b91c1c" },
  { name: "Student loans", group: "DEBT", icon: "BookOpen", color: "#b91c1c" },
  { name: "Car loan", group: "DEBT", icon: "Car", color: "#b91c1c" },
  {
    name: "Emergency fund",
    group: "SAVINGS",
    icon: "LifeBuoy",
    color: "#047857",
  },
  {
    name: "House down payment",
    group: "SAVINGS",
    icon: "Key",
    color: "#047857",
  },
  {
    name: "Investments",
    group: "SAVINGS",
    icon: "TrendingUp",
    color: "#047857",
  },
  {
    name: "Transfer",
    group: "TRANSFER",
    icon: "ArrowLeftRight",
    color: "#475569",
  },
];
