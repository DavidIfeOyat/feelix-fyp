import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type CreateUserBody = {
  email?: string;
  password?: string;
  username?: string;
};

function badRequest(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return badRequest("Dev create-user route is disabled in production.", 403);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return badRequest(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.",
        500
      );
    }

    const body = (await req.json()) as CreateUserBody;

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const username = String(body.username ?? "").trim();

    if (!email || !password || !username) {
      return badRequest("Email, password, and username are required.");
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return badRequest(
        "Username must be 3–20 characters and use only letters, numbers, or underscores."
      );
    }

    if (password.length < 8) {
      return badRequest("Password must be at least 8 characters long.");
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: existingProfile, error: usernameCheckError } = await admin
      .from("profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();

    if (usernameCheckError) {
      return badRequest(`Username check failed: ${usernameCheckError.message}`, 500);
    }

    if (existingProfile) {
      return badRequest("That username is already taken.", 409);
    }

    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
      },
    });

    if (createUserError) {
      return badRequest(`Auth creation failed: ${createUserError.message}`, 400);
    }

    const userId = createdUser.user?.id;

    if (!userId) {
      return badRequest("User was created but no user id was returned.", 500);
    }

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        user_id: userId,
        username,
        display_name: username,
        bio: "Your personal cinema hub",
      },
      { onConflict: "user_id" }
    );

    if (profileError) {
      return badRequest(`Profile creation failed: ${profileError.message}`, 500);
    }

    return NextResponse.json({
      ok: true,
      userId,
      email,
      username,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return badRequest(`Unexpected error: ${message}`, 500);
  }
}