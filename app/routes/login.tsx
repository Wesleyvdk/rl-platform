import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { createUserSession, getUserSession } from "~/utils/session.server";
import { prisma } from "~/lib/prisma.server";
import { Layout } from "~/components/layout";

export async function loader({ request }: LoaderFunctionArgs) {
  const { userId } = await getUserSession(request);
  if (userId) {
    return redirect("/");
  }
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get("username");
  const platformId = formData.get("platformId");

  if (!username || !platformId) {
    return json(
      { error: "Username and Platform ID are required" },
      { status: 400 }
    );
  }

  // Find or create user
  const user = await prisma.user.upsert({
    where: { platformId: platformId.toString() },
    update: { username: username.toString() },
    create: {
      username: username.toString(),
      platformId: platformId.toString(),
    },
  });

  return createUserSession(user.id, "/");
}

export default function Login() {
  const actionData = useActionData<typeof action>();

  return (
    <Layout user={null}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>6mans Platform</CardTitle>
            <CardDescription>
              Enter your details to join the queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="Your Rocket League username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platformId">Platform ID</Label>
                <Input
                  id="platformId"
                  name="platformId"
                  type="text"
                  required
                  placeholder="Your platform ID (Steam, Epic, etc.)"
                />
              </div>
              {actionData?.error && (
                <p className="text-sm text-red-500">{actionData.error}</p>
              )}
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
