import env from "./env";
import { PrismaClient } from "./generated/prisma";

export const $db = new PrismaClient({
  errorFormat: env.NODE_ENV === "development" ? "pretty" : "colorless",
}).$extends({
  model: {
    user: {
      /**
       * By default checks if a verified user exists by email
       */
      async exists(email: string, verified = true): Promise<Boolean> {
        const user = await $db.user.findByEmail(email, verified);
        return !!user;
      },

      async findByEmail(email: string, verified?: boolean) {
        return await $db.user.findUnique({
          where: {
            email,
            isVerified: verified,
          },
          select: {
            id: true,
            hashedPassword: true,
          },
        });
      },
    },
  },
});
