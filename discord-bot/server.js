
require("dotenv").config();

const express = require("express");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const app = express();
app.use(express.json());

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const ORDERS_CHANNEL_ID = process.env.DISCORD_ORDERS_CHANNEL_ID;
const ORDER_API_SECRET = process.env.ORDER_API_SECRET;

const PORT = process.env.PORT || 3001;

if (!TOKEN) {
  throw new Error("Missing DISCORD_BOT_TOKEN");
}

if (!ORDERS_CHANNEL_ID) {
  throw new Error("Missing DISCORD_ORDERS_CHANNEL_ID");
}

if (!ORDER_API_SECRET) {
  throw new Error("Missing ORDER_API_SECRET");
}


// Create Discord Order
app.post("/api/orders", async (req, res) => {

  try {

    const secret = req.headers["x-order-secret"];

    if (secret !== ORDER_API_SECRET) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }


    const {
      orderId,
      username,
      userId,
      product,
      robux,
      price,
      status,
    } = req.body;


    if (
      !orderId ||
      !username ||
      !product ||
      !robux ||
      !price
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing order information",
      });
    }


    const channel = await client.channels.fetch(
      ORDERS_CHANNEL_ID
    );


    if (!channel || !channel.isTextBased()) {
      return res.status(500).json({
        success: false,
        error: "Orders channel unavailable",
      });
    }


    const embed = new EmbedBuilder()

      .setTitle("🛒 NEW ROBUX ORDER")

      .setDescription(
        "A new customer order has been received."
      )

      .addFields(

        {
          name: "Order ID",
          value: `\`${orderId}\``,
          inline: true,
        },

        {
          name: "Status",
          value: status || "🟡 PENDING",
          inline: true,
        },

        {
          name: "Product",
          value: product,
          inline: true,
        },

        {
          name: "Roblox Username",
          value: username,
          inline: true,
        },

        {
          name: "Roblox User ID",
          value: userId
            ? String(userId)
            : "Not provided",
          inline: true,
        },

        {
          name: "Robux",
          value: `${robux} Robux`,
          inline: true,
        },

        {
          name: "Price",
          value: `$${Number(price).toFixed(2)}`,
          inline: true,
        },

        {
          name: "Estimated Delivery",
          value: "10–15 minutes",
          inline: false,
        }

      )

      .setFooter({
        text: "Robux Store",
      })

      .setTimestamp();


    const buttons =
      new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId(
            `order_success:${orderId}`
          )
          .setLabel("SUCCESS — SENT ROBUX")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(
            `order_cancel:${orderId}`
          )
          .setLabel("CANCEL ORDER")
          .setStyle(ButtonStyle.Danger)

      );


    const message =
      await channel.send({
        embeds: [embed],
        components: [buttons],
      });


    return res.json({
      success: true,
      orderId,
      messageId: message.id,
    });


  } catch (error) {

    console.error("Order creation error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to create Discord order",
    });

  }

});


// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    botReady: client.isReady(),
  });
});


client.once("ready", () => {

  console.log(
    `✅ Discord bot online as ${client.user.tag}`
  );

app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `✅ Order API running on port ${PORT}`
    );

  });

});


client.login(TOKEN);
