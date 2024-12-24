import { LoaderFunctionArgs } from "@remix-run/node";

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import { authenticator } from "~/auth.server";
import "./tailwind.css";
import { ToastProvider } from "./components/ui/toast";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request);
  return new Response(JSON.stringify({ user }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
  // return Response.json({ user });
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <ToastProvider>
          <div className="min-h-screen bg-background">
            <Outlet context={{ user }} />
          </div>
        </ToastProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
