
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      orderId,
      username,
      userId,
      product,
      robux,
      price,
      status,
    } = body;

    if (
      !orderId ||
      !username ||
      !product ||
      !robux ||
      price === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing order information",
        },
        { status: 400 }
      );
    }

    const botUrl =
      process.env.DISCORD_BOT_API_URL ||
      "http://localhost:3001";

    const secret = process.env.ORDER_API_SECRET;

    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          error: "ORDER_API_SECRET is not configured",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${botUrl}/api/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-order-secret": secret,
        },
        body: JSON.stringify({
          orderId,
          username,
          userId,
          product,
          robux,
          price,
          status: status || "🟡 PENDING",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            data.error ||
            "Discord order creation failed",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: data.orderId,
      messageId: data.messageId,
    });

  } catch (error) {
    console.error("Order API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Server error",
      },
      { status: 500 }
    );
  }
}
