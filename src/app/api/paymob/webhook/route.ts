import { NextResponse } from "next/server";

type OrderMetadata = {
  orderId?: string;
  userId?: string;
  username?: string;
  displayName?: string;
  amount?: string;
  method?: "plus" | "gamepass";
  price?: string;
};

export async function POST(
  req: Request
) {
  try {
    const body = await req.json();

    console.log(
      "PAYMOB WEBHOOK:",
      JSON.stringify(
        body,
        null,
        2
      )
    );

    const transaction =
      body.obj || body;

    const success =
      transaction.success === true;

    if (!success) {
      return NextResponse.json({
        received: true,
        status:
          "payment_not_successful",
      });
    }

    /*
      Get metadata containing the
      ORIGINAL website order information.
    */

    const metadata: OrderMetadata =
      transaction.order?.metadata ||
      transaction.metadata ||
      {};

    console.log(
      "ORDER METADATA:",
      metadata
    );

    const orderId =
      metadata.orderId ||
      transaction.order
        ?.merchant_order_id ||
      transaction.merchant_order_id ||
      transaction.special_reference;

    const username = String(
      metadata.username || ""
    ).trim();

    const displayName = String(
      metadata.displayName ||
      username
    ).trim();

    const userId = Number(
      metadata.userId
    );

    const amount = Number(
      metadata.amount
    );

    const method =
      metadata.method;

    const price = Number(
      metadata.price
    );

    /*
      Validate the original order data.
    */

    if (
      !orderId ||
      !username
    ) {
      console.error(
        "Missing order ID or username:",
        {
          orderId,
          username,
          metadata,
        }
      );

      return NextResponse.json(
        {
          error:
            "Missing original order information.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      console.error(
        "Invalid Robux amount:",
        metadata.amount
      );

      return NextResponse.json(
        {
          error:
            "Invalid Robux amount.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      method !== "plus" &&
      method !== "gamepass"
    ) {
      console.error(
        "Invalid delivery method:",
        method
      );

      return NextResponse.json(
        {
          error:
            "Invalid delivery method.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        price
      ) ||
      price <= 0
    ) {
      console.error(
        "Invalid order price:",
        metadata.price
      );

      return NextResponse.json(
        {
          error:
            "Invalid order price.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Discord bot API
    */

    const BOT_API =
      process.env.DISCORD_BOT_API_URL;

    const SECRET =
      process.env.ORDER_API_SECRET;

    if (
      !BOT_API ||
      !SECRET
    ) {
      console.error(
        "Missing Discord bot environment variables."
      );

      return NextResponse.json(
        {
          error:
            "Server configuration error.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      This is the exact order
      sent to your Discord bot.
    */

    const discordOrder = {
      orderId,

      userId:
        Number.isFinite(userId) &&
        userId > 0
          ? userId
          : null,

      username,

      displayName,

      /*
        REAL ROBUX AMOUNT
        Example: 100
        NOT payment price
      */

      amount,

      robux:
        amount,

      /*
        Must be:
        plus
        OR
        gamepass
      */

      method,

      /*
        Payment price
      */

      price,

      status:
        "PAID",

      estimatedDelivery:
        "10-15 minutes",

      createdAt:
        new Date().toISOString(),
    };

    console.log(
      "SENDING ORDER TO DISCORD:",
      discordOrder
    );

    const orderResponse =
      await fetch(
        `${BOT_API}/api/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-order-secret":
              SECRET,
          },

          body:
            JSON.stringify(
              discordOrder
            ),
        }
      );

    let result;

    try {
      result =
        await orderResponse.json();
    } catch {
      result = {
        error:
          "Invalid response from Discord bot.",
      };
    }

    console.log(
      "DISCORD ORDER RESULT:",
      result
    );

    if (
      !orderResponse.ok
    ) {
      console.error(
        "Discord bot rejected order:",
        result
      );

      return NextResponse.json(
        {
          error:
            result.error ||
            "Could not send order to Discord.",
        },
        {
          status: 502,
        }
      );
    }

    console.log(
      `SUCCESSFUL PAYMENT SENT TO DISCORD: ${orderId}`
    );

    return NextResponse.json({
      received: true,
      success: true,

      orderId,

      robux:
        amount,

      method,

      messageId:
        result.messageId ||
        null,
    });

  } catch (error) {

    console.error(
      "PAYMOB WEBHOOK ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook failed.",
      },
      {
        status: 500,
      }
    );
  }
}