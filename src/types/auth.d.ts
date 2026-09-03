import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/constants";

declare module "next-auth" {
  interface User {
    role?: Role;
    organizationId?: string;
    mfaEnrollRequired?: boolean;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      organizationId: string;
      mfaEnrollRequired?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    organizationId: string;
    mfaEnrollRequired?: boolean;
  }
}
