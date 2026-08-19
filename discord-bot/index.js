
require("dotenv").config();

const http = require("http");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  REST,
  Routes,
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const ORDERS_CHANNEL_ID =
  process.env.DISCORD_ORDERS_CHANNEL_ID;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const ORDER_API_SECRET =
  process.env.ORDER_API_SECRET;

const PORT = Number(process.env.PORT || 3001);


// ==========================================
// CHECK ENVIRONMENT VARIABLES
// ==========================================

for (const [name, value] of Object.entries({
  DISCORD_BOT_TOKEN: TOKEN,
  DISCORD_ORDERS_CHANNEL_ID:
    ORDERS_CHANNEL_ID,
  DISCORD_CLIENT_ID: CLIENT_ID,
  DISCORD_GUILD_ID: GUILD_ID,
  ORDER_API_SECRET,
})) {
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
}


// ==========================================
// CREATE TEST ORDER ID
// ==========================================

function createOrderId() {
  return `RBX-${Math.random()
    .toString(36)
    .slice(2, 10)
    .toUpperCase()}`;
}


// ==========================================
// CREATE ORDER EMBED
// ==========================================

function createOrderEmbed(order) {
  const robux = Number(
    order.robux ?? order.amount
  );

  const isGamePass =
    order.method === "gamepass";

  const received = isGamePass
    ? Math.floor(robux * 0.7)
    : robux;

  const createdAt = new Date(
    order.createdAt || Date.now()
  );

  const timestamp = Math.floor(
    createdAt.getTime() / 1000
  );

  return new EmbedBuilder()
    .setTitle("🛒 New Robux Order")
    .setDescription(
      [
        `**Order ID:** \`${order.orderId}\``,
        "",
        "A new order is ready for processing.",
      ].join("\n")
    )
    .addFields(
      {
        name: "👤 Customer",
        value: [
          `**Username:** \`${order.username}\``,
          `**Display Name:** ${
            order.displayName ||
            "Not provided"
          }`,
          `**User ID:** \`${
            order.userId ||
            "Not provided"
          }\``,
        ].join("\n"),
        inline: false,
      },
      {
        name: "📦 Order",
        value: [
          `**Method:** ${
            isGamePass
              ? "🎮 Game Pass"
              : "💎 Roblox Plus"
          }`,
          `**Requested:** ${robux.toLocaleString()} Robux`,
          `**Customer receives:** ${received.toLocaleString()} Robux`,
        ].join("\n"),
        inline: false,
      },
      {
        name: "💰 Payment",
        value: `**Price:** $${Number(
          order.price
        ).toFixed(2)}`,
        inline: true,
      },
      {
        name: "📊 Status",
        value:
          "🟢 **RECEIVED & READY FOR PROCESSING**",
        inline: true,
      },
      {
        name: "⏱️ Delivery",
        value:
          `10–15 minutes\n` +
          `<t:${timestamp}:R>`,
        inline: false,
      }
    )
    .setFooter({
      text:
        "Robux Store • Order Management",
    })
    .setTimestamp(createdAt);
}


// ==========================================
// CREATE ORDER BUTTONS
// ==========================================

function createButtons(orderId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(
        `order_success:${orderId}`
      )
      .setLabel("SUCCESS SENT ROBUX!")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(
        `order_cancel:${orderId}`
      )
      .setLabel("CANCEL ORDER")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Danger)
  );
}


// ==========================================
// SEND ORDER TO DISCORD
// ==========================================

async function sendOrderToDiscord(order) {
  console.log(
    "📦 Sending order to Discord:",
    order.orderId
  );

  const channel =
    await client.channels.fetch(
      ORDERS_CHANNEL_ID
    );

  if (
    !channel ||
    !channel.isTextBased()
  ) {
    throw new Error(
      "Orders channel is unavailable."
    );
  }

  const message = await channel.send({
    embeds: [
      createOrderEmbed(order),
    ],
    components: [
      createButtons(order.orderId),
    ],
  });

  console.log(
    "✅ Order sent successfully:",
    message.id
  );

  return message;
}


// ==========================================
// REGISTER SLASH COMMAND
// ==========================================

const rest = new REST({
  version: "10",
}).setToken(TOKEN);

async function registerCommands() {
  try {
    console.log(
      "Registering slash commands..."
    );

    await rest.put(
      Routes.applicationGuildCommands(
        CLIENT_ID,
        GUILD_ID
      ),
      {
        body: [
          {
            name: "test-order",
            description:
              "Create a test Robux order",
          },
        ],
      }
    );

    console.log(
      "✅ Slash commands registered."
    );
  } catch (error) {
    console.error(
      "❌ Failed to register commands:",
      error
    );
  }
}


// ==========================================
// BOT READY
// ==========================================

client.once(
  "ready",
  async () => {
    console.log(
      `🤖 Bot is online as ${client.user.tag}`
    );

    try {
      const channel =
        await client.channels.fetch(
          ORDERS_CHANNEL_ID
        );

      console.log(
        `📍 Orders channel: ${
          channel?.name || "NOT FOUND"
        }`
      );
    } catch (error) {
      console.error(
        "❌ Could not fetch orders channel:",
        error
      );
    }

    await registerCommands();
  }
);


// ==========================================
// DISCORD INTERACTIONS
// ==========================================

client.on(
  "interactionCreate",
  async (interaction) => {
    console.log(
      "🔔 Interaction received:",
      interaction.type,
      interaction.isChatInputCommand()
        ? interaction.commandName
        : interaction.isButton()
          ? interaction.customId
          : "other"
    );

    try {


      // ------------------------------------
      // TEST ORDER COMMAND
      // ------------------------------------

      if (
        interaction.isChatInputCommand()
      ) {
        if (
          interaction.commandName !==
          "test-order"
        ) {
          return;
        }

        await interaction.deferReply({
          ephemeral: true,
        });

        console.log(
          "⏳ Test-order interaction deferred"
        );

        const orderId =
          createOrderId();

        const order = {
          orderId,
          userId: "5696295687",
          username: "DODO_446565",
          displayName:
            "Test Customer",
          method: "plus",
          robux: 100,
          amount: 100,
          price: 1.99,
          status:
            "RECEIVED",
          estimatedDelivery:
            "10-15 minutes",
          createdAt:
            new Date().toISOString(),
        };

        await sendOrderToDiscord(
          order
        );

        await interaction.editReply({
          content:
            `✅ Test order \`${orderId}\` ` +
            "created successfully.",
        });

        console.log(
          "✅ Test-order interaction completed"
        );

        return;
      }


      // ------------------------------------
      // BUTTONS
      // ------------------------------------

      if (interaction.isButton()) {
        const [action, orderId] =
          interaction.customId.split(":");

        if (!orderId) {
          return;
        }


        // SUCCESS SENT ROBUX
        if (action === "order_success") {
          const completedEmbed =
            EmbedBuilder.from(
              interaction.message.embeds[0]
            );

          const updatedFields =
            completedEmbed.data.fields.map(
              (field) => {
                if (
                  field.name ===
                  "📊 Status"
                ) {
                  return {
                    name: "📊 Status",
                    value:
                      "🟢 **COMPLETED**",
                    inline: true,
                  };
                }

                return field;
              }
            );

          completedEmbed
            .setColor(0x57f287)
            .setFields(
              updatedFields
            )
            .setFooter({
              text:
                `Completed by ` +
                `${interaction.user.username}`,
            });

          await interaction.update({
            embeds: [
              completedEmbed,
            ],
            components: [],
          });

          console.log(
            `✅ Order completed: ${orderId} ` +
            `by ${interaction.user.tag}`
          );

          return;
        }


        // CANCEL ORDER
        if (action === "order_cancel") {
          const modal =
            new ModalBuilder()
              .setCustomId(
                `cancel_reason:${orderId}`
              )
              .setTitle(
                "Cancel Order"
              );

          const reasonInput =
            new TextInputBuilder()
              .setCustomId(
                "reason"
              )
              .setLabel(
                "Cancellation reason"
              )
              .setPlaceholder(
                "Write the reason for cancelling this order..."
              )
              .setStyle(
                TextInputStyle.Paragraph
              )
              .setRequired(true)
              .setMinLength(3)
              .setMaxLength(500);

          const modalRow =
            new ActionRowBuilder()
              .addComponents(
                reasonInput
              );

          modal.addComponents(
            modalRow
          );

          await interaction.showModal(
            modal
          );

          return;
        }
      }


      // ------------------------------------
      // CANCEL ORDER MODAL
      // ------------------------------------

      if (
        interaction.isModalSubmit()
      ) {
        const [action, orderId] =
          interaction.customId.split(":");

        if (
          action !==
            "cancel_reason" ||
          !orderId
        ) {
          return;
        }

        const reason =
          interaction.fields
            .getTextInputValue(
              "reason"
            );

        const originalMessage =
          interaction.message;

        const cancelledEmbed =
          EmbedBuilder.from(
            originalMessage.embeds[0]
          );

        const updatedFields =
          cancelledEmbed.data.fields.map(
            (field) => {
              if (
                field.name ===
                "📊 Status"
              ) {
                return {
                  name:
                    "📊 Status",
                  value:
                    "🔴 **CANCELLED**",
                  inline: true,
                };
              }

              return field;
            }
          );

        cancelledEmbed
          .setColor(0xed4245)
          .setFields(
            updatedFields
          )
          .setFooter({
            text:
              `Cancelled by ` +
              `${interaction.user.username}`,
          });

        await originalMessage.edit({
          embeds: [
            cancelledEmbed,
          ],
          components: [],
        });

        await interaction.reply({
          content:
            `❌ Order \`${orderId}\` ` +
            "has been cancelled successfully.",
          ephemeral: true,
        });

        console.log(
          `❌ Order cancelled: ${orderId}`
        );

        console.log(
          `Reason: ${reason}`
        );

        console.log(
          `Cancelled by: ` +
          interaction.user.tag
        );

        return;
      }


    } catch (error) {
      console.error(
        "❌ Interaction error:",
        error
      );

      try {
        if (
          interaction.isRepliable() &&
          !interaction.replied &&
          !interaction.deferred
        ) {
          await interaction.reply({
            content:
              "❌ An error occurred. Check the bot terminal.",
            ephemeral: true,
          });
        } else if (
          interaction.isRepliable() &&
          interaction.deferred
        ) {
          await interaction.editReply({
            content:
              "❌ An error occurred while processing this request.",
          });
        }
      } catch (replyError) {
        console.error(
          "❌ Could not send error reply:",
          replyError
        );
      }
    }
  }
);


// ==========================================
// WEBSITE ORDER API
// ==========================================

const server =
  http.createServer(
    (req, res) => {
      if (
        req.method === "POST" &&
        req.url === "/api/orders"
      ) {
        const secret =
          req.headers[
            "x-order-secret"
          ];

        if (
          secret !==
          ORDER_API_SECRET
        ) {
          res.writeHead(
            401,
            {
              "Content-Type":
                "application/json",
            }
          );

          res.end(
            JSON.stringify({
              success: false,
              error:
                "Unauthorized",
            })
          );

          return;
        }

        let body = "";

        req.on(
          "data",
          (chunk) => {
            body += chunk;
          }
        );

        req.on(
          "end",
          async () => {
            try {
              const order =
                JSON.parse(body);

              const robux =
                Number(
                  order.robux ??
                  order.amount
                );

              if (
                !order.orderId ||
                !order.username ||
                !order.method ||
                !Number.isFinite(
                  robux
                ) ||
                robux <= 0
              ) {
                res.writeHead(
                  400,
                  {
                    "Content-Type":
                      "application/json",
                  }
                );

                res.end(
                  JSON.stringify({
                    success: false,
                    error:
                      "Missing order information",
                  })
                );

                return;
              }

              order.robux =
                robux;

              order.amount =
                robux;

              const message =
                await sendOrderToDiscord(
                  order
                );

              console.log(
                `📦 Website order sent to Discord: ${order.orderId}`
              );

              res.writeHead(
                200,
                {
                  "Content-Type":
                    "application/json",
                }
              );

              res.end(
                JSON.stringify({
                  success: true,
                  orderId:
                    order.orderId,
                  messageId:
                    message.id,
                })
              );
            } catch (error) {
              console.error(
                "❌ Order API error:",
                error
              );

              res.writeHead(
                500,
                {
                  "Content-Type":
                    "application/json",
                }
              );

              res.end(
                JSON.stringify({
                  success: false,
                  error:
                    "Could not process order",
                })
              );
            }
          }
        );

        return;
      }

      res.writeHead(
        404,
        {
          "Content-Type":
            "application/json",
        }
      );

      res.end(
        JSON.stringify({
          success: false,
          error: "Not found",
        })
      );
    }
  );


// ==========================================
// START ORDER API
// ==========================================

server.listen(
  PORT,
  () => {
    console.log(
      `🌐 Order API: http://localhost:${PORT}/api/orders`
    );
  }
);


// ==========================================
// START DISCORD BOT
// ==========================================

client.login(TOKEN);

