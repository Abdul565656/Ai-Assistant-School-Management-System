// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, DefaultSession } from "next-auth";
// import { JWT as NextAuthJWT } from "next-auth/jwt"; // We might not need to import this if we are just augmenting
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db/connectDB";
import MongooseUser, { UserRole } from "@/lib/db/models/user.model";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT { // Define the structure of your JWT directly
    id: string;
    role: UserRole;
    name?: string | null;
    email?: string | null;
    picture?: string | null; // Standard claim for user image
    // Other standard claims like 'sub', 'iat', 'exp' are usually handled by NextAuth.js
    // If you need to explicitly type them, you can add them here.
    // sub?: string; // Subject (usually user ID)
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<any | null> {
        if (!credentials?.email || !credentials?.password) {
          console.log("Authorize: Missing credentials");
          return null;
        }
        try {
          await connectDB();
          const dbUser = await MongooseUser.findOne({ email: credentials.email.toLowerCase() }).lean();
          if (!dbUser) {
            console.log("Authorize: No user found with email:", credentials.email);
            return null;
          }
          if (!dbUser.hashedPassword) {
            console.log("Authorize: User found but has no password:", dbUser.email);
            return null;
          }
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            dbUser.hashedPassword
          );
          if (!isValidPassword) {
            console.log("Authorize: Invalid password for user:", dbUser.email);
            return null;
          }
          console.log("Authorize: Credentials valid for user:", dbUser.email);
          return { // This object populates the `user` parameter in the `jwt` callback
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            image: undefined, // If your MongooseUser has an image, map it here
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // `user` is from `authorize` or OAuth. It should match `next-auth.User`
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Standard claims (NextAuth might already do this if properties exist on `user`)
        if (user.name) token.name = user.name;
        if (user.email) token.email = user.email;
        if (user.image) token.picture = user.image; // map 'image' from User to 'picture' in JWT
        // token.sub = user.id; // The 'sub' (subject) claim is typically the user's ID
      }
      return token;
    },
    async session({ session, token }) {
      // `token` is the JWT from the `jwt` callback. It should match `next-auth/jwt.JWT`
      if (token && session.user) {
        session.user.id = token.id; // id is string
        session.user.role = token.role;
        // DefaultSession user properties (name, email, image) are usually populated by NextAuth
        // if they exist in the token (token.name, token.email, token.picture for image)
        // session.user.name = token.name;
        // session.user.email = token.email;
        // session.user.image = token.picture; // map 'picture' from JWT to 'image' in Session
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };