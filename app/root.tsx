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
import { getUserSession } from "~/utils/session.server";
import { prisma } from "~/lib/prisma.server";
import { ToastProvider } from "~/contexts/toast-context";

export async function loader({ request }: LoaderFunctionArgs) {
  const { userId } = await getUserSession(request);
  let user = null;

  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, mmr: true },
    });
  }

  return json({ user });
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
            <Outlet />
          </div>
        </ToastProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
