import { NextResponse } from "next/server";

export async function POST(req: Request) {

  try {

    const { userId, code, bio } = await req.json();


    if (!userId || !code || !bio) {
      return NextResponse.json({
        success:false,
        message:"Missing information"
      });
    }


    if (bio.trim() === code.trim()) {

      return NextResponse.json({
        success:true,
        message:"Your bio is correct"
      });

    }


    return NextResponse.json({
      success:false,
      message:`Your code is ${bio}. This bio is incorrect`
    });


  } catch {

    return NextResponse.json({
      success:false,
      message:"Server error"
    },{
      status:500
    });

  }

}