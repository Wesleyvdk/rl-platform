import { json, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { ToastProvider } from "~/contexts/toast-context";
import { authenticator } from "~/auth.server";
import "./tailwind.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request);
  return Response.json({ user });
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
        <LiveReload />
      </body>
    </html>
  );
}
