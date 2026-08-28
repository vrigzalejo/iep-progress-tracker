import { demoEmail } from "@/lib/brand";

export const DEMO_ACCOUNTS = [
  {
    role: "Administrator",
    email: demoEmail("chris.okonkwo"),
    name: "Chris Okonkwo",
  },
  {
    role: "Educator",
    email: demoEmail("maya.ellis"),
    name: "Maya Ellis",
  },
  {
    role: "Provider",
    email: demoEmail("priya.shah"),
    name: "Priya Shah",
  },
  {
    role: "Parent / guardian",
    email: demoEmail("dana.hale"),
    name: "Dana Hale",
  },
] as const;
