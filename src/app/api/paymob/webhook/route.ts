import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("PAYMOB WEBHOOK:", body);


    /*
      Paymob sends transaction status here.
      We only continue when payment is successful.
    */

    const success =
      body.success === true ||
      body.obj?.success === true;


    if (!success) {
      return NextResponse.json({
        received: true,
        status: "payment_not_successful",
      });
    }


    const transaction =
      body.obj || body;


    const orderId =
      transaction.order?.merchant_order_id ||
      transaction.merchant_order_id ||
      transaction.special_reference;


    if (!orderId) {
      console.error(
        "Missing order id from Paymob webhook"
      );

      return NextResponse.json(
        {
          error: "Missing order id",
        },
        {
          status: 400,
        }
      );
    }


    /*
      Here we notify your order system
      after successful payment.
    */

    const BOT_API =
      process.env.DISCORD_BOT_API_URL ||
      "http://localhost:3001";


    const SECRET =
      process.env.ORDER_API_SECRET;


    const orderResponse =
      await fetch(
        `${BOT_API}/api/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-order-secret":
              SECRET || "",
          },

          body: JSON.stringify({
            orderId,

            username:
              transaction.billing_data
                ?.first_name ||
              "Customer",

            displayName:
              "Paymob Customer",

            userId:
              null,

            amount:
              transaction.amount_cents
                ? transaction.amount_cents / 100
                : 0,

            method:
              "paymob",

            price:
              transaction.amount_cents
                ? transaction.amount_cents / 100
                : 0,

            status:
              "PAID",
          }),
        }
      );


    const result =
      await orderResponse.json();


    console.log(
      "Discord order result:",
      result
    );


    return NextResponse.json({
      received: true,
      success: true,
    });


  } catch (error) {

    console.error(
      "Paymob webhook error:",
      error
    );


    return NextResponse.json(
      {
        error:
          "Webhook failed",
      },
      {
        status: 500,
      }
    );
  }
}