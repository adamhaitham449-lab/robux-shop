import { NextResponse } from "next/server";

type PaymentBody = {
  orderId?: string;
  username?: string;
  amount?: number;
  price?: number;
  phone?: string;
  email?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PaymentBody;

    const orderId = String(body.orderId || "").trim();
    const username = String(body.username || "").trim();

    const amount = Number(body.amount);

    // IMPORTANT:
    // price must be in EGP.
    const priceEGP = Number(body.price);

    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();

    if (!orderId || !username) {
      return NextResponse.json(
        {
          error: "Missing order information.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error: "Invalid Robux amount.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(priceEGP) || priceEGP <= 0) {
      return NextResponse.json(
        {
          error: "Invalid price.",
        },
        { status: 400 }
      );
    }

    const PAYMOB_SECRET_KEY =
      process.env.PAYMOB_SECRET_KEY;

    const PAYMOB_PUBLIC_KEY =
      process.env.PAYMOB_PUBLIC_KEY;

    const PAYMOB_INTEGRATION_ID = Number(
      process.env.PAYMOB_CARD_INTEGRATION_ID
    );

    if (
      !PAYMOB_SECRET_KEY ||
      !PAYMOB_PUBLIC_KEY ||
      !PAYMOB_INTEGRATION_ID
    ) {
      console.error(
        "Missing Paymob environment variables."
      );

      return NextResponse.json(
        {
          error:
            "Paymob configuration is incomplete.",
        },
        { status: 500 }
      );
    }

    const APP_URL =
      process.env.APP_URL ||
      "https://robux-shop-one.vercel.app/";

    const amountCents = Math.round(
      priceEGP * 100
    );

    const paymobResponse = await fetch(
      "https://accept.paymob.com/v1/intention/",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Token ${PAYMOB_SECRET_KEY}`,
        },

        body: JSON.stringify({
          amount: amountCents,

          currency: "EGP",

          payment_methods: [
            PAYMOB_INTEGRATION_ID,
          ],

          items: [
            {
              name:
                `${amount} Robux for ${username}`,

              amount: amountCents,

              description:
                `Robux order ${orderId}`,

              quantity: 1,
            },
          ],

         billing_data: {
  first_name: "Customer",
  last_name: "Robux",
  email:
    email ||
    "customer@example.com",

  // Paymob requires this field
  // Customer will enter payment details on Paymob page
  phone_number: "01000000000",

  apartment: "NA",
  floor: "NA",
  street: "NA",
  building: "NA",
  shipping_method: "NA",
  postal_code: "NA",
  city: "Cairo",
  state: "Cairo",
  country: "EG",
},

customer: {
  first_name:
    username || "Customer",

  last_name:
    "Robux",

  email:
    email ||
    "customer@example.com",
},

special_reference: orderId,

notification_url:
  `${APP_URL}/api/paymob/webhook`,

redirection_url:
  `${APP_URL}/payment/complete`,
}),
}
);


const paymobData =
  await paymobResponse.json();


if (!paymobResponse.ok) {

  console.error(
    "Paymob API error:",
    paymobData
  );

  return NextResponse.json(
    {
      error:
        "Could not create payment.",

      details:
        paymobData,
    },
    {
      status: 500,
    }
  );
}


const clientSecret =
  paymobData.client_secret;


if (!clientSecret) {

  console.error(
    "Paymob did not return client_secret:",
    paymobData
  );

  return NextResponse.json(
    {
      error:
        "Paymob payment session was not created.",
    },
    {
      status: 500,
    }
  );
}


const checkoutUrl =
  `https://accept.paymob.com/unifiedcheckout/` +
  `?publicKey=${encodeURIComponent(
    PAYMOB_PUBLIC_KEY
  )}` +
  `&clientSecret=${encodeURIComponent(
    clientSecret
  )}`;


return NextResponse.json({

  success: true,

  checkoutUrl,

  orderId,

});


} catch (error) {

console.error(
  "Create Paymob payment error:",
  error
);


return NextResponse.json(
  {
    error:
      "Could not create payment.",
  },
  {
    status: 500,
  }
);

}
}