import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Layout } from "~/components/layout";
import { authenticator } from "~/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.isAuthenticated(request, {
    successRedirect: "/",
  });
}

export async function action({ request }: ActionFunctionArgs) {
  return await authenticator.authenticate("discord", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
}

export default function Login() {
  return (
    <Layout user={null}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>6mans Platform</CardTitle>
            <CardDescription>
              Login with Discord to join the queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post">
              <Button type="submit" className="w-full">
                Login with Discord
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
