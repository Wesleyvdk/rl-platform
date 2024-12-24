import { prisma } from "~/lib/prisma.server";
import { broadcastQueueUpdate } from "~/services/ws.server";

export async function createMatchFromQueue(queueId: string) {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: { players: true },
  });

  if (!queue || queue.players.length !== 6) {
    throw new Error("Queue must have exactly 6 players");
  }

  // Sort players by MMR for balanced team creation
  const sortedPlayers = [...queue.players].sort((a, b) => b.mmr - a.mmr);

  // Create balanced teams (1st, 4th, 6th vs 2nd, 3rd, 5th)
  const blueTeam = [sortedPlayers[0], sortedPlayers[3], sortedPlayers[5]];
  const orangeTeam = [sortedPlayers[1], sortedPlayers[2], sortedPlayers[4]];

  // Create the match
  const match = await prisma.match.create({
    data: {
      blueTeam: {
        connect: blueTeam.map((player) => ({ id: player.id })),
      },
      orangeTeam: {
        connect: orangeTeam.map((player) => ({ id: player.id })),
      },
    },
  });

  // Update queue status
  await prisma.queue.update({
    where: { id: queueId },
    data: {
      status: "completed",
      match: { connect: { id: match.id } },
    },
  });

  // Broadcast queue update
  await broadcastQueueUpdate();

  return match;
}
