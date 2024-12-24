import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/prisma.server";
import { getSession } from "~/utils/session.server";
import { broadcastQueueUpdate } from "~/services/ws.server";
import { authenticator } from "~/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await authenticator.isAuthenticated(request);

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    switch (request.method) {
      case "POST": {
        // Check if the user exists in the database
        const userExists = await prisma.user.findUnique({
          where: { id: user.id },
        });

        if (!userExists) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "User does not exist in the database",
            }),
            { status: 400 }
          );
        }

        // Check if user is already in a queue
        const existingQueue = await prisma.queue.findFirst({
          where: {
            players: { some: { id: user.id } },
            status: "waiting",
          },
        });

        if (existingQueue) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "You are already in a queue",
            }),
            { status: 400 }
          );
        }

        // Join queue if a waiting queue exists
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
          return new Response(
            JSON.stringify({
              success: true,
              message: "Joined queue successfully",
              queue: updatedQueue,
            }),
            { status: 200 }
          );
        }

        // Create a new queue
        try {
          const newQueue = await prisma.queue.create({
            data: {
              status: "waiting",
              players: {
                connect: [{ id: user.id }],
              },
            },
            include: { players: true },
          });

          console.log("Created new queue:", newQueue);
          await broadcastQueueUpdate();
          return new Response(
            JSON.stringify({
              success: true,
              message: "Created new queue and joined successfully",
              queue: newQueue,
            }),
            { status: 201 }
          );
        } catch (error) {
          console.error("Queue creation error:", error);

          // Handle specific Prisma P2025 error (related records not found)
          if (error instanceof prisma.PrismaClientKnownRequestError) {
            return new Response(
              JSON.stringify({
                success: false,
                message:
                  "Queue creation failed. Related records were not found.",
              }),
              { status: 400 }
            );
          }

          return new Response(
            JSON.stringify({
              success: false,
              message: "Failed to create queue",
              error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 500 }
          );
        }
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
          return new Response(
            JSON.stringify({
              success: false,
              message: "Not in queue",
            }),
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
        return new Response(
          JSON.stringify({
            success: true,
            message: "Left queue successfully",
            queue: updatedQueue,
          }),
          { status: 200 }
        );
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            message: "Method not allowed",
          }),
          { status: 405 }
        );
    }
  } catch (error) {
    console.error("Queue action error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "An unexpected error occurred",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getSession();

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const queue = await prisma.queue.findFirst({
      where: { status: "waiting" },
      include: { players: true },
    });

    return new Response(
      JSON.stringify({
        success: true,
        queue,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Queue loader error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "An unexpected error occurred",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500 }
    );
  }
}
