import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getSession } from "~/utils/session.server";
import { prisma } from "~/lib/prisma.server";
import { Layout } from "~/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const currentUser = await getSession();
  const { playerId } = params;

  const player = await prisma.user.findUnique({
    where: { id: playerId },
    include: {
      matches: {
        include: {
          blueTeam: true,
          orangeTeam: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!player) {
    throw new Response("Player not found", { status: 404 });
  }

  const winRate = (player.wins / (player.wins + player.losses)) * 100 || 0;

  return Response.json({ currentUser, player, winRate });
}

export default function PlayerProfile() {
  const { currentUser, player, winRate } = useLoaderData<typeof loader>();

  return (
    <Layout user={currentUser}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{player.username}'s Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>
                  <strong>MMR:</strong> {player.mmr}
                </p>
                <p>
                  <strong>Wins:</strong> {player.wins}
                </p>
                <p>
                  <strong>Losses:</strong> {player.losses}
                </p>
              </div>
              <div>
                <p>
                  <strong>Win Rate:</strong> {winRate.toFixed(2)}%
                </p>
                <p>
                  <strong>Platform ID:</strong> {player.platformId}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Blue Team</TableHead>
                  <TableHead>Orange Team</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {player.matches.map((match: any) => {
                  const playerTeam = match.blueTeam.some(
                    (p: any) => p.id === player.id
                  )
                    ? "blue"
                    : "orange";
                  const result = match.winner
                    ? match.winner === playerTeam
                      ? "Win"
                      : "Loss"
                    : "Pending";
                  return (
                    <TableRow key={match.id}>
                      <TableCell>
                        {new Date(match.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{result}</TableCell>
                      <TableCell>
                        {match.blueTeam.map((p: any) => p.username).join(", ")}
                      </TableCell>
                      <TableCell>
                        {match.orangeTeam
                          .map((p: any) => p.username)
                          .join(", ")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
