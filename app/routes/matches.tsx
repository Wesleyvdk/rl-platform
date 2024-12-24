import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUser } from "~/utils/session.server";
import { prisma } from "~/lib/prisma.server";
import { Layout } from "~/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const matches = await prisma.match.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      blueTeam: true,
      orangeTeam: true,
    },
  });

  return json({ user, matches });
}

export default function Matches() {
  const { user, matches } = useLoaderData<typeof loader>();

  return (
    <Layout user={user}>
      <h1 className="text-3xl font-bold mb-6">Recent Matches</h1>
      <div className="space-y-6">
        {matches.map((match: any) => (
          <Card key={match.id}>
            <CardHeader>
              <CardTitle>Match {match.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2 text-blue-500">
                    Blue Team
                  </h3>
                  <ul>
                    {match.blueTeam.map((player: any) => (
                      <li key={player.id}>{player.username}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-orange-500">
                    Orange Team
                  </h3>
                  <ul>
                    {match.orangeTeam.map((player: any) => (
                      <li key={player.id}>{player.username}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <p>
                  Winner:{" "}
                  {match.winner
                    ? match.winner === "blue"
                      ? "Blue Team"
                      : "Orange Team"
                    : "Not decided"}
                </p>
                <p>Created at: {new Date(match.createdAt).toLocaleString()}</p>
                {match.completedAt && (
                  <p>
                    Completed at: {new Date(match.completedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
