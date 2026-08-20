import { NextResponse } from "next/server";

type CreateOrderBody = {
  userId?: number;
  username?: string;
  displayName?: string;
  amount?: number;
  method?: "plus" | "gamepass";
  price?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderBody;

    const userId = Number(body.userId);
    const amount = Number(body.amount);
    const price = Number(body.price);

    const username = String(body.username || "").trim();
    const displayName = String(
      body.displayName || ""
    ).trim();

    const method = body.method;

    if (!userId || !username) {
      return NextResponse.json(
        {
          error: "Invalid Roblox account.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(amount)) {
      return NextResponse.json(
        {
          error: "Robux amount must be a whole number.",
        },
        { status: 400 }
      );
    }

    // Roblox Plus: 10–500 only
    if (
      method === "plus" &&
      (amount < 10 || amount > 500)
    ) {
      return NextResponse.json(
        {
          error:
            "Roblox Plus amount must be between 10 and 500.",
        },
        { status: 400 }
      );
    }

    // Game Pass: no maximum limit
    if (
      method === "gamepass" &&
      amount < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Game Pass amount must be at least 1 Robux.",
        },
        { status: 400 }
      );
    }

    if (
      method !== "plus" &&
      method !== "gamepass"
    ) {
      return NextResponse.json(
        {
          error: "Invalid delivery method.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        {
          error: "Invalid order price.",
        },
        { status: 400 }
      );
    }

    const orderId =
      "RBX-" +
      crypto
        .randomUUID()
        .replaceAll("-", "")
        .slice(0, 10)
        .toUpperCase();

    const order = {
  orderId,

  userId,
  username,
  displayName,

  // New field names used by the website
  amount,
  method,

  // Fields expected by the Discord bot
  robux: amount,
  product:
    method === "plus"
      ? "Roblox Plus"
      : "Game Pass",

  price,
  status: "PENDING",

  estimatedDelivery: "10-15 minutes",
  createdAt: new Date().toISOString(),
};
    console.log("NEW ORDER:", order);

    const botUrl =
  process.env.DISCORD_BOT_API_URL ||
  "http://78.154.103.20:13956";

    const secret = process.env.ORDER_API_SECRET;

    if (!secret) {
      console.error(
        "Missing ORDER_API_SECRET in .env.local"
      );

      return NextResponse.json(
        {
          error:
            "Order service is not configured.",
        },
        { status: 500 }
      );
    }

    const botResponse = await fetch(
      `${botUrl}/api/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-order-secret": secret,
        },
        body: JSON.stringify(order),
      }
    );

    const botData = await botResponse.json();

    if (!botResponse.ok) {
      console.error(
        "Discord bot API error:",
        botData
      );

      return NextResponse.json(
        {
          error:
            botData.error ||
            "Could not send order to Discord.",
        },
        { status: 502 }
      );
    }

    console.log(
      "ORDER SENT TO DISCORD:",
      botData
    );

    return NextResponse.json({
      success: true,
      orderId,
      messageId: botData.messageId || null,
    });

  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      {
        error: "Could not create order.",
      },
      { status: 500 }
    );
  }
}