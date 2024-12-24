import { ActionFunctionArgs, json, LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";
import { getSession } from "~/utils/session.server";
import { broadcastQueueUpdate } from "~/services/ws.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await getSession();

    switch (request.method) {
      case "POST": {
        // Join queue
        const queue = await prisma.queue.findFirst({
          where: { status: "waiting" },
          include: { players: true },
        });

        if (queue && queue.players.length < 6) {
          const updatedQueue = await prisma.queue.update({
            where: { id: queue.id },
            data: {
              players: { connect: { id: user.id } },
            },
            include: { players: true },
          });

          await broadcastQueueUpdate();
          return json({ success: true, message: "Joined queue successfully" });
        }

        // Create new queue if none exists
        const newQueue = await prisma.queue.create({
          data: {
            players: { connect: { id: user.id } },
          },
          include: { players: true },
        });

        await broadcastQueueUpdate();
        return json({
          success: true,
          message: "Created new queue and joined successfully",
        });
      }

      case "DELETE": {
        // Leave queue
        const queue = await prisma.queue.findFirst({
          where: {
            players: { some: { id: user.id } },
            status: "waiting",
          },
        });

        if (!queue) {
          return json(
            { success: false, message: "Not in queue" },
            { status: 404 }
          );
        }

        const updatedQueue = await prisma.queue.update({
          where: { id: queue.id },
          data: {
            players: { disconnect: { id: user.id } },
          },
          include: { players: true },
        });

        await broadcastQueueUpdate();
        return json({ success: true, message: "Left queue successfully" });
      }

      default:
        return json(
          { success: false, message: "Method not allowed" },
          { status: 405 }
        );
    }
  } catch (error) {
    console.error("Queue action error:", error);
    return json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    await getSession();

    const queue = await prisma.queue.findFirst({
      where: { status: "waiting" },
      include: { players: true },
    });

    return json({ success: true, queue });
  } catch (error) {
    console.error("Queue loader error:", error);
    return json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
