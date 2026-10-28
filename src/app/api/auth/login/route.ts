import { NextRequest, NextResponse } from "next/server";
import { loginWithEmail, getCurrentUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const user = await loginWithEmail(email);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to login" }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}
