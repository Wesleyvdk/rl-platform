import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useFetcher, Link } from "@remix-run/react";

interface MatchCardProps {
  match: {
    id: string;
    blueTeam: Array<{ id: string; username: string; mmr: number }>;
    orangeTeam: Array<{ id: string; username: string; mmr: number }>;
    winner?: "blue" | "orange";
  };
  currentUserId: string;
}

export function MatchCard({ match, currentUserId }: MatchCardProps) {
  const fetcher = useFetcher();
  const isInMatch = [...match.blueTeam, ...match.orangeTeam].some(
    (player) => player.id === currentUserId
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Match</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold mb-2 text-blue-500">Blue Team</h3>
            <div className="space-y-1">
              {match.blueTeam.map((player) => (
                <div key={player.id} className="flex justify-between">
                  <Link
                    to={`/players/${player.id}`}
                    className="hover:underline"
                  >
                    {player.username}
                  </Link>
                  <span className="text-muted-foreground">
                    MMR: {player.mmr}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-orange-500">Orange Team</h3>
            <div className="space-y-1">
              {match.orangeTeam.map((player) => (
                <div key={player.id} className="flex justify-between">
                  <Link
                    to={`/players/${player.id}`}
                    className="hover:underline"
                  >
                    {player.username}
                  </Link>
                  <span className="text-muted-foreground">
                    MMR: {player.mmr}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isInMatch && !match.winner && (
          <div className="mt-6 flex justify-center gap-4">
            <fetcher.Form method="post" action={`/api/match/${match.id}`}>
              <input type="hidden" name="winner" value="blue" />
              <Button
                type="submit"
                variant="outline"
                className="border-blue-500 text-blue-500"
              >
                Blue Team Won
              </Button>
            </fetcher.Form>

            <fetcher.Form method="post" action={`/api/match/${match.id}`}>
              <input type="hidden" name="winner" value="orange" />
              <Button
                type="submit"
                variant="outline"
                className="border-orange-500 text-orange-500"
              >
                Orange Team Won
              </Button>
            </fetcher.Form>
          </div>
        )}

        {match.winner && (
          <div className="mt-6 text-center font-semibold">
            {match.winner === "blue" ? (
              <span className="text-blue-500">Blue Team Won!</span>
            ) : (
              <span className="text-orange-500">Orange Team Won!</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
