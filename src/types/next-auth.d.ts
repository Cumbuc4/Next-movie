import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username?: string;
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    username: string;
  }
}
