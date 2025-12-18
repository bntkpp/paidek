import { NextResponse } from "next/server";

export async function GET() {
  const vars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "Presente (Starts with " + process.env.RESEND_API_KEY.substring(0, 3) + ")" : "MISSING",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
  
  console.log("Debug Env:", vars);
  return NextResponse.json(vars);
}
