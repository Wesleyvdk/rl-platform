import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "~/lib/prisma.server";
import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/utils/session.server";
import {
  DiscordProfile,
  DiscordStrategy,
  PartialDiscordGuild,
} from "remix-auth-discord";

type CustomDiscordGuild = Omit<PartialDiscordGuild, "features">;

export interface DiscordUser {
  id: DiscordProfile["id"];
  displayName: DiscordProfile["displayName"];
  avatar: DiscordProfile["__json"]["avatar"];
  email: DiscordProfile["__json"]["email"];
  locale?: string;
  guilds?: Array<CustomDiscordGuild>;
  accessToken: string;
  refreshToken: string;
}

export const authenticator = new Authenticator<DiscordUser>(sessionStorage);

const discordStrategy = new DiscordStrategy(
  {
    clientID: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    callbackURL: process.env.CALLBACK_URL!,
    // Provide all the scopes you want as an array
    scope: ["identify", "email", "guilds"],
  },
  async ({
    accessToken,
    refreshToken,
    extraParams,
    profile,
  }): Promise<DiscordUser> => {
    /**
     * Construct the user profile to your liking by adding data you fetched etc.
     * and only returning the data that you actually need for your application.
     */

    try {
      const user = await prisma.user.upsert({
        where: {
          discordId: profile.id,
        },
        update: {
          username: profile.displayName,
          discordAvatar: profile.__json.avatar,
          updatedAt: new Date(),
        },
        create: {
          discordId: profile.id,
          username: profile.displayName,
          platformId: `discord-${profile.id}`,
          discordAvatar: profile.__json.avatar,
          mmr: 1000,
          wins: 0,
          losses: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log("Created/Updated user:", user);
      return user;
    } catch (error) {
      console.error("Error creating/updating user:", error);
      throw error;
    }
  }
);

authenticator.use(discordStrategy);
