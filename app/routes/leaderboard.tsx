import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { getSession } from "~/utils/session.server";
import { prisma } from "~/lib/prisma.server";
import { Layout } from "~/components/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { authenticator } from "~/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request);

  const players = await prisma.user.findMany({
    orderBy: { mmr: "desc" },
    take: 100,
  });

  return Response.json({ user, players });
}

export default function Leaderboard() {
  const { user, players } = useLoaderData<typeof loader>();

  return (
    <Layout user={user}>
      <h1 className="text-3xl font-bold mb-6">Leaderboard</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">MMR</TableHead>
            <TableHead className="text-right">Wins</TableHead>
            <TableHead className="text-right">Losses</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player: any, index: any) => (
            <TableRow key={player.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>
                <Link to={`/players/${player.id}`} className="hover:underline">
                  {player.username}
                </Link>
              </TableCell>
              <TableCell className="text-right">{player.mmr}</TableCell>
              <TableCell className="text-right">{player.wins}</TableCell>
              <TableCell className="text-right">{player.losses}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Layout>
  );
}
