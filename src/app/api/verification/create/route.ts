import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required"
        },
        {
          status: 400
        }
      );
    }


    const code =
      "RBX-" +
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();



    return NextResponse.json({
      success: true,
      code
    });


  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        message: "Server error"
      },
      {
        status: 500
      }
    );

  }
}