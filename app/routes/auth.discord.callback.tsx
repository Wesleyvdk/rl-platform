import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "~/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return await authenticator.authenticate("discord", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
}
