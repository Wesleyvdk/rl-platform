import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { DiscordUser } from "../auth.server";
import { Toaster } from "./ui/toaster";

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

export function Layout({ children, user }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            6mans Platform
          </Link>
          <nav className="space-x-4">
            <Link to="/" className="hover:text-gray-300">
              Home
            </Link>
            <Link to="/leaderboard" className="hover:text-gray-300">
              Leaderboard
            </Link>
            <Link to="/matches" className="hover:text-gray-300">
              Matches
            </Link>
            {user ? (
              <span className="text-sm">
                {user.displayName} (MMR: {user.mmr})
                <form action="/logout" method="post" className="inline ml-4">
                  <Button variant="outline" size="sm" type="submit">
                    Logout
                  </Button>
                </form>
              </span>
            ) : (
              <Link to="/login" className="hover:text-gray-300">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto py-8">{children}</main>
      <Toaster />
      <footer className="bg-gray-800 text-white p-4">
        <div className="container mx-auto text-center">
          &copy; 2024 6mans Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
