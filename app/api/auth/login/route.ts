import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

// Simple password verification using environment variable
// In production, you should use a more secure method like bcrypt
function verifyPassword(inputPassword: string): boolean {
  const correctPassword = process.env.ADMIN_PASSWORD;
  
  if (!correctPassword) {
    console.error("ADMIN_PASSWORD environment variable is not set");
    return false;
  }

  return inputPassword === correctPassword;
}

// Create a simple session token
function createSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // For now, username is optional but can be validated if ADMIN_USERNAME is set
    const adminUsername = process.env.ADMIN_USERNAME;
    if (adminUsername && username !== adminUsername) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (verifyPassword(password)) {
      // Create session token
      const sessionToken = createSessionToken();
      
      // Set cookie with session token (expires in 7 days)
      const cookieStore = await cookies();
      cookieStore.set("auth_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

