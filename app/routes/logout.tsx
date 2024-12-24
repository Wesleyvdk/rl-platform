import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { authenticator } from "~/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  await authenticator.logout(request, { redirectTo: "/login" });
}

export async function loader() {
  return redirect("/login");
}
