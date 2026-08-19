import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Get Roblox user ID + display name
    const userResponse = await fetch(
  "https://users.roblox.com/v1/usernames/users",
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Robux-Store-App/1.0",
    },

    body: JSON.stringify({
      usernames: [username],
      excludeBannedUsers: true,
    }),

    signal: AbortSignal.timeout(30000),
  }
);

    const userData = await userResponse.json();

    if (!userData.data || userData.data.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const robloxUser = userData.data[0];

    // Get avatar
    const avatarResponse = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${robloxUser.id}&size=150x150&format=Png&isCircular=true`
    );

    const avatarData = await avatarResponse.json();

    const avatarUrl =
      avatarData.data?.[0]?.imageUrl || null;


    return NextResponse.json({
      success: true,
      user: {
        id: robloxUser.id,
        username: robloxUser.name,
        displayName: robloxUser.displayName,
        description: "",
        avatarUrl,
      },
    });

  } catch (error) {
    console.error("ROBLOX ERROR:", error);

    return NextResponse.json(
      {
        error: "Roblox connection failed"
      },
      {
        status: 500
      }
    );
  }
}