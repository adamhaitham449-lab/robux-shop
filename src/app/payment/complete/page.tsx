"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentComplete() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);


  return (
    <main className="min-h-screen flex items-center justify-center bg-[#050507] text-white">
      <div className="text-center">

        <div className="text-6xl mb-5">
          ✅
        </div>

        <h1 className="text-3xl font-bold">
          Payment Successful
        </h1>

        <p className="mt-3 text-gray-400">
          Your payment was received.
        </p>

        <p className="mt-2 text-gray-400">
          Your Robux order is being processed.
        </p>

      </div>
    </main>
  );
}