import { demoEmail, DEMO_USER_DISPLAY_NAMES } from "@/lib/brand";

export const DEMO_ACCOUNTS = [
  {
    role: "Administrator",
    email: demoEmail("crisanto.reyes"),
    name: DEMO_USER_DISPLAY_NAMES["crisanto.reyes"],
  },
  {
    role: "Educator",
    email: demoEmail("maricel.santos"),
    name: DEMO_USER_DISPLAY_NAMES["maricel.santos"],
  },
  {
    role: "Provider",
    email: demoEmail("patricia.cruz"),
    name: DEMO_USER_DISPLAY_NAMES["patricia.cruz"],
  },
  {
    role: "Parent / guardian",
    email: demoEmail("diana.santos"),
    name: DEMO_USER_DISPLAY_NAMES["diana.santos"],
  },
] as const;
