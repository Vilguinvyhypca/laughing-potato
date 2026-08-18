import { NextResponse } from "next/server";
import { jellyfinAuthorization, jellyfinJson } from "../../../../lib/jellyfin";

export const dynamic = "force-dynamic";

type AuthenticationResult = {
  AccessToken: string;
  User: { Id: string; Name: string };
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;
  const username = payload?.username?.trim() ?? "";
  const password = payload?.password ?? "";

  if (!username) {
    return NextResponse.json({ error: "Enter your Jellyfin username." }, { status: 400 });
  }

  try {
    const auth = await jellyfinJson<AuthenticationResult>("/Users/AuthenticateByName", {
      method: "POST",
      headers: {
        Authorization: jellyfinAuthorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ Username: username, Pw: password }),
    });

    const response = NextResponse.json({ user: { id: auth.User.Id, name: auth.User.Name } });
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    };
    response.cookies.set("jellyfin_token", auth.AccessToken, cookieOptions);
    response.cookies.set("jellyfin_user", auth.User.Id, cookieOptions);
    response.cookies.set("jellyfin_name", encodeURIComponent(auth.User.Name), cookieOptions);
    return response;
  } catch {
    return NextResponse.json(
      { error: "Jellyfin rejected that username or password." },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ signedOut: true });
  for (const name of ["jellyfin_token", "jellyfin_user", "jellyfin_name"]) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}
