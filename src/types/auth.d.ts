import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role: Role;
    organizationId: string;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      organizationId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    organizationId: string;
  }
}
