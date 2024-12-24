import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticator } from "~/auth.server";
import { prisma } from "~/lib/prisma.server";
import { getSession } from "~/utils/session.server";

export async function action({ request, params }: ActionFunctionArgs) {
  await authenticator.isAuthenticated(request);
  const { matchId } = params;

  if (request.method !== "POST") {
    throw Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const winner = formData.get("winner");

  if (winner !== "blue" && winner !== "orange") {
    throw Response.json({ error: "Invalid winner" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { blueTeam: true, orangeTeam: true },
  });

  if (!match) {
    throw Response.json({ error: "Match not found" }, { status: 404 });
  }

  // Update match result
  await prisma.match.update({
    where: { id: matchId },
    data: {
      winner,
      completedAt: new Date(),
    },
  });

  // Update player MMR and stats
  const winningTeam = winner === "blue" ? match.blueTeam : match.orangeTeam;
  const losingTeam = winner === "blue" ? match.orangeTeam : match.blueTeam;

  // Winners gain 10 MMR, losers lose 10 MMR
  await Promise.all([
    ...winningTeam.map((player: any) =>
      prisma.user.update({
        where: { id: player.id },
        data: {
          mmr: { increment: 10 },
          wins: { increment: 1 },
        },
      })
    ),
    ...losingTeam.map((player: any) =>
      prisma.user.update({
        where: { id: player.id },
        data: {
          mmr: { decrement: 10 },
          losses: { increment: 1 },
        },
      })
    ),
  ]);

  return Response.json({ success: true });
}
