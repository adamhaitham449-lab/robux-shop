
"use client";

import { useMemo, useState } from "react";

type RobloxUser = {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type DeliveryMethod = "plus" | "gamepass";

export default function Home() {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState<RobloxUser | null>(null);

  const [loading, setLoading] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  const [error, setError] = useState("");
  const [orderError, setOrderError] = useState("");

  const [robux, setRobux] = useState(100);
  const [customAmount, setCustomAmount] = useState("100");

  const [method, setMethod] =
    useState<DeliveryMethod>("plus");

  const [orderId, setOrderId] = useState("");
  const [orderCreated, setOrderCreated] = useState(false);

  const amount = useMemo(() => {
    const parsed = Number(customAmount);

    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.floor(parsed);
  }, [customAmount]);

  const gamePassReceive = Math.floor(amount * 0.7);

  const plusPrices: Record<number, number> = {
    10: 0.29,
    50: 0.99,
    100: 1.99,
    250: 4.49,
    500: 8.99,
  };

  const gamePassPrice = useMemo(() => {
    if (amount <= 0) return null;

    // Game Pass can use any amount.
    // This price is lower than Roblox Plus.
    return Number((amount * 0.01799).toFixed(2));
  }, [amount]);

  const price =
    method === "plus"
      ? plusPrices[amount] ?? null
      : gamePassPrice;

  const amountValid =
    method === "plus"
      ? amount >= 10 && amount <= 500
      : amount >= 1;

  async function searchUser() {
    if (!username.trim()) {
      setError("Enter your Roblox username.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        "/api/roblox/lookup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.error || "User not found."
        );
        return;
      }

      setUser(data.user);
    } catch {
      setError(
        "Connection error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateAmount(value: string) {
    setCustomAmount(value);

    const parsed = Number(value);

    if (
      Number.isFinite(parsed) &&
      parsed >= 1
    ) {
      setRobux(Math.floor(parsed));
    }

    setOrderError("");
  }

  function selectPreset(value: number) {
    setRobux(value);
    setCustomAmount(String(value));
    setOrderError("");
  }

  function changeMethod(
    newMethod: DeliveryMethod
  ) {
    setMethod(newMethod);
    setOrderError("");

    if (newMethod === "plus") {
      if (amount < 10 || amount > 500) {
        setRobux(100);
        setCustomAmount("100");
      }
    }
  }

 async function createOrder() {
  setOrderError("");

  if (!user) {
    setOrderError(
      "Please enter your Roblox username first."
    );
    return;
  }

  if (method === "plus") {
    if (amount < 10 || amount > 500) {
      setOrderError(
        "Roblox Plus amount must be between 10 and 500 Robux."
      );
      return;
    }
  }

  if (method === "gamepass" && amount < 1) {
    setOrderError(
      "Please enter a valid Robux amount."
    );
    return;
  }

  if (!price || price <= 0) {
    setOrderError(
      "Invalid price."
    );
    return;
  }

  setCreatingOrder(true);

  const newOrderId =
    "RBX-" +
    crypto.randomUUID()
      .replaceAll("-", "")
      .slice(0, 10)
      .toUpperCase();

  try {
    const paymentRes = await fetch(
      "/api/paymob/create-payment",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          orderId: newOrderId,

          userId: user.id,

          username: user.username,

          displayName:
            user.displayName,

          amount,

          method,

          price,

          phone:
            "01000000000",

          email:
            "customer@example.com",
        }),
      }
    );


    const paymentData =
      await paymentRes.json();


    if (!paymentRes.ok) {
      setOrderError(
        paymentData.error ||
        "Could not start payment."
      );
      return;
    }


    setOrderId(
      paymentData.orderId
    );


    window.location.href =
      paymentData.checkoutUrl;


  } catch (error) {

    console.error(
      "Payment error:",
      error
    );

    setOrderError(
      "Could not connect to payment server."
    );

  } finally {

    setCreatingOrder(false);

  }
}

  function reset() {
    setUser(null);
    setUsername("");
    setError("");
    setOrderError("");
    setOrderId("");
    setOrderCreated(false);
    setMethod("plus");
    setRobux(100);
    setCustomAmount("100");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050507] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2563eb35,transparent_42%)]" />

        <div className="absolute left-[-100px] top-40 h-80 w-80 rounded-full bg-blue-600/20 blur-[120px]" />

        <div className="absolute bottom-[-100px] right-[-50px] h-96 w-96 rounded-full bg-purple-600/15 blur-[140px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="text-3xl font-black tracking-tight">
            ROBUX
            <span className="text-blue-500">.</span>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-gray-300">
            🔒 Secure Store
          </div>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        {!user && !orderCreated && (
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              ⚡ Fast Roblox delivery
            </div>

            <h1 className="text-5xl font-black leading-tight md:text-7xl">
              Get Robux
              <br />
              <span className="text-blue-500">
                Instantly.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400">
              Enter your Roblox username to start your
              order.
            </p>

            <div className="mt-10 rounded-[32px] border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl">
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    searchUser();
                  }
                }}
                placeholder="Roblox Username"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 outline-none transition focus:border-blue-500"
              />

              {error && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                onClick={searchUser}
                disabled={loading}
                className="mt-5 w-full rounded-2xl bg-blue-600 py-4 font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Searching..."
                  : "Continue"}
              </button>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-gray-400 sm:grid-cols-3">
              <div>⚡ Fast processing</div>
              <div>🔒 Secure orders</div>
              <div>💬 Discord support</div>
            </div>
          </div>
        )}

        {user && !orderCreated && (
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            {/* User */}
            <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-widest text-gray-500">
                  Account
                </span>

                <button
                  onClick={reset}
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  Change
                </button>
              </div>

              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="mx-auto h-32 w-32 rounded-full border-4 border-blue-500/20 shadow-xl"
                />
              ) : (
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-blue-600 text-4xl font-black">
                  {user.username
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div className="mt-6 text-center">
                <h2 className="text-3xl font-black">
                  {user.displayName}
                </h2>

                <p className="mt-1 text-gray-400">
                  @{user.username}
                </p>

                <p className="mt-3 text-xs text-gray-600">
                  User ID: {user.id}
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <div className="rounded-2xl bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Order protection
                  </p>

                  <p className="mt-1 font-semibold">
                    Your order receives a unique Order ID.
                  </p>
                </div>

                <div className="rounded-2xl bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    Estimated delivery
                  </p>

                  <p className="mt-1 font-semibold">
                    10–15 minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Order */}
            <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
                  Step 2
                </p>

                <h2 className="mt-2 text-4xl font-black">
                  Build your order
                </h2>
              </div>

              {/* Method */}
              <div className="mt-8">
                <p className="mb-3 font-bold">
                  Delivery method
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() =>
                      changeMethod("plus")
                    }
                    className={`rounded-2xl border p-5 text-left transition ${
                      method === "plus"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 bg-black/20 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black">
                        Roblox Plus
                      </span>

                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                        Recommended
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-400">
                      Full Robux delivery.
                    </p>

                    <p className="mt-3 text-xs text-gray-500">
                      10–500 Robux per order
                    </p>
                  </button>

                  <button
                    onClick={() =>
                      changeMethod("gamepass")
                    }
                    className={`rounded-2xl border p-5 text-left transition ${
                      method === "gamepass"
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-white/10 bg-black/20 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black">
                        Game Pass
                      </span>

                      <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
                        No Limit
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-400">
                      Enter any Robux amount.
                    </p>

                    <p className="mt-3 text-xs text-gray-500">
                      Roblox takes 30%.
                    </p>
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <p className="font-bold">
                    Robux amount
                  </p>

                  <span className="text-sm text-gray-500">
                    {method === "plus"
                      ? "10–500"
                      : "No maximum limit"}
                  </span>
                </div>

                <input
                  type="number"
                  min={method === "plus" ? 10 : 1}
                  max={
                    method === "plus"
                      ? 500
                      : undefined
                  }
                  value={customAmount}
                  onChange={(e) =>
                    updateAmount(e.target.value)
                  }
                  placeholder="Enter Robux amount"
                  className={`mt-3 w-full rounded-2xl border bg-black/40 px-5 py-4 text-xl font-black outline-none ${
                    method === "gamepass"
                      ? "border-yellow-500/30 focus:border-yellow-500"
                      : "border-white/10 focus:border-blue-500"
                  }`}
                />

                {method === "plus" && (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {[10, 50, 100, 250, 500].map(
                      (value) => (
                        <button
                          key={value}
                          onClick={() =>
                            selectPreset(value)
                          }
                          className={`rounded-xl py-3 text-sm font-bold transition ${
                            robux === value
                              ? "bg-blue-600"
                              : "bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          {value}
                        </button>
                      )
                    )}
                  </div>
                )}

                {method === "plus" &&
                  amount > 500 && (
                    <p className="mt-3 text-sm text-red-400">
                      Roblox Plus maximum is 500 Robux.
                    </p>
                  )}

                {method === "plus" &&
                  amount > 0 &&
                  amount < 10 && (
                    <p className="mt-3 text-sm text-red-400">
                      Roblox Plus minimum is 10 Robux.
                    </p>
                  )}

                {method === "gamepass" &&
                  amount < 1 && (
                    <p className="mt-3 text-sm text-red-400">
                      Please enter a valid Robux amount.
                    </p>
                  )}
              </div>

              {/* Game Pass warning */}
              {method === "gamepass" &&
                amount >= 1 && (
                  <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">
                    <p className="font-black text-yellow-300">
                      ⚠️ Warning: Roblox takes 30%
                    </p>

                    <p className="mt-2 text-sm leading-6 text-gray-300">
                      You choose {amount.toLocaleString()}{" "}
                      Robux. After Roblox's 30% fee, the
                      expected amount you receive is{" "}
                      {gamePassReceive.toLocaleString()}{" "}
                      Robux.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-xs text-gray-500">
                          You choose
                        </p>

                        <p className="text-xl font-black">
                          {amount.toLocaleString()} Robux
                        </p>
                      </div>

                      <div className="rounded-xl bg-black/20 p-3">
                        <p className="text-xs text-gray-500">
                          You receive
                        </p>

                        <p className="text-xl font-black text-yellow-300">
                          {gamePassReceive.toLocaleString()}{" "}
                          Robux
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Summary */}
              <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
                <p className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  Order Summary
                </p>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Account
                    </span>

                    <span className="font-semibold">
                      @{user.username}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Method
                    </span>

                    <span className="font-semibold">
                      {method === "plus"
                        ? "Roblox Plus"
                        : "Game Pass"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Robux
                    </span>

                    <span className="font-black">
                      {amount.toLocaleString()}
                    </span>
                  </div>

                  {method === "gamepass" && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">
                        Customer receives
                      </span>

                      <span className="font-black text-yellow-300">
                        {gamePassReceive.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-end justify-between">
                      <span className="text-gray-400">
                        Price
                      </span>

                      <span className="text-3xl font-black">
                        {price
                          ? `$${price.toFixed(2)}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {orderError && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  {orderError}
                </div>
              )}

              <button
                onClick={createOrder}
                disabled={
                  creatingOrder ||
                  !amountValid ||
                  !price
                }
                className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-black transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {creatingOrder
                  ? "Creating Order..."
                  : "Create Order"}
              </button>

              <p className="mt-4 text-center text-xs text-gray-600">
                Payment will be added in the final
                checkout stage.
              </p>
            </div>
          </div>
        )}

        {/* Order Created */}
        {orderCreated && (
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-4xl">
              ✓
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-widest text-green-400">
              Order Created
            </p>

            <h1 className="mt-3 text-5xl font-black">
              You're all set.
            </h1>

            <p className="mt-5 text-gray-400">
              Your order has been created successfully.
            </p>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-left backdrop-blur-xl">
              <div className="rounded-2xl bg-black/40 p-5 text-center">
                <p className="text-xs uppercase tracking-widest text-gray-500">
                  Order ID
                </p>

                <p className="mt-2 text-2xl font-black text-blue-400">
                  {orderId}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Roblox
                  </span>

                  <span className="font-bold">
                    @{user?.username}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Method
                  </span>

                  <span className="font-bold">
                    {method === "plus"
                      ? "Roblox Plus"
                      : "Game Pass"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Robux
                  </span>

                  <span className="font-bold">
                    {amount.toLocaleString()}
                  </span>
                </div>

                {method === "gamepass" && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Expected after 30%
                    </span>

                    <span className="font-bold text-yellow-300">
                      {gamePassReceive.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Estimated delivery
                  </span>

                  <span className="font-bold">
                    10–15 minutes
                  </span>
                </div>
              </div>
            </div>

            <a
              href="https://discord.com/"
              target="_blank"
              rel="noreferrer"
              className="mt-6 block w-full rounded-2xl bg-[#5865F2] py-4 font-black transition hover:bg-[#4752C4]"
            >
              💬 Join Discord & Track Order
            </a>

            <button
              onClick={reset}
              className="mt-4 text-sm text-gray-500 hover:text-white"
            >
              Create another order
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
