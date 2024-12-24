import { prisma } from "~/lib/prisma.server";
import type { Player } from "~/types/queue";

export async function createMatch(players: Player[]) {
  if (players.length !== 6) {
    throw new Error("Need exactly 6 players to create a match");
  }

  // Sort players by MMR for balanced team creation
  const sortedPlayers = [...players].sort((a, b) => b.mmr - a.mmr);

  // Create balanced teams (1st, 4th, 6th vs 2nd, 3rd, 5th)
  const blueTeam = [sortedPlayers[0], sortedPlayers[3], sortedPlayers[5]];
  const orangeTeam = [sortedPlayers[1], sortedPlayers[2], sortedPlayers[4]];

  return prisma.match.create({
    data: {
      blueTeam: { connect: blueTeam.map((p) => ({ id: p.id })) },
      orangeTeam: { connect: orangeTeam.map((p) => ({ id: p.id })) },
    },
    include: {
      blueTeam: true,
      orangeTeam: true,
    },
  });
}
