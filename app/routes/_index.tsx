import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { requireUser } from "~/utils/session.server";
import { prisma } from "~/lib/prisma.server";
import { useWebSocket } from "~/hooks/use-websocket";
import { MatchCard } from "~/components/match-card";
import { createMatchFromQueue } from "~/services/match-maker.server";
import { useToast } from "~/contexts/toast-context";
import { Layout } from "~/components/layout";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const queue = await prisma.queue.findFirst({
    where: { status: "waiting" },
    include: { players: true },
  });

  if (queue && queue.players.length === 6) {
    const match = await createMatchFromQueue(queue.id);
    return json({ user, queue: null, match });
  }

  const activeMatch = await prisma.match.findFirst({
    where: { completedAt: null },
    include: { blueTeam: true, orangeTeam: true },
  });

  const totalMatches = await prisma.match.count();
  const totalPlayers = await prisma.user.count();
  const topPlayer = await prisma.user.findFirst({
    orderBy: { mmr: "desc" },
  });

  return Response.json({
    user,
    queue,
    match: activeMatch,
    totalMatches,
    totalPlayers,
    topPlayer,
  });
}

export default function Index() {
  const {
    user,
    queue: initialQueue,
    match: initialMatch,
    totalMatches,
    totalPlayers,
    topPlayer,
  } = useLoaderData<typeof loader>();
  const [queue, setQueue] = useState(initialQueue);
  const [match, setMatch] = useState(initialMatch);
  const fetcher = useFetcher();
  const { sendMessage } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000"
  );
  const { addToast } = useToast();

  useEffect(() => {
    const ws = new WebSocket(
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000"
    );

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "queue:update") {
        setQueue(data.queue);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const isInQueue = queue?.players.some((p: any) => p.id === user.id);
  const isFull = queue?.players.length === 6;

  const handleQueueAction = () => {
    fetcher.submit(
      {},
      {
        method: isInQueue ? "DELETE" : "POST",
        action: "/api/queue",
      }
    );
    sendMessage({ type: "queue:join" });
  };

  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data) {
        addToast({
          title: "Success",
          description: `${fetcher.data}`,
          variant: "default",
        });
      } else {
        addToast({
          title: "Error",
          description: fetcher.data,
          variant: "destructive",
        });
      }
    }
  }, [fetcher.data, addToast]);

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalMatches}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Players</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalPlayers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top Player</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{topPlayer?.username}</p>
              <p className="text-sm text-muted-foreground">
                MMR: {topPlayer?.mmr}
              </p>
            </CardContent>
          </Card>
        </div>

        {match && <MatchCard match={match} currentUserId={user.id} />}

        <Card>
          <CardHeader>
            <CardTitle>6mans Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    Players in Queue ({queue?.players.length ?? 0}/6)
                  </h2>
                  <div className="space-y-2">
                    {queue?.players.map((player: any) => (
                      <div key={player.id} className="flex items-center gap-2">
                        <span>{player.username}</span>
                        <span className="text-sm text-muted-foreground">
                          MMR: {player.mmr}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2">Queue Status</h2>
                  <div className="text-sm text-muted-foreground">
                    {isFull
                      ? "Queue is full! Starting match..."
                      : "Waiting for players..."}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleQueueAction}
                  disabled={isFull || fetcher.state === "submitting" || match}
                  variant={isInQueue ? "destructive" : "default"}
                >
                  {isInQueue ? "Leave Queue" : "Join Queue"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
