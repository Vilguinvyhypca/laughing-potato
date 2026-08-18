import { NextResponse } from "next/server";
import { jellyfinJson } from "../../../../lib/jellyfin";

export const dynamic = "force-dynamic";

type PublicSystemInfo = {
  ServerName: string;
  Version: string;
  StartupWizardCompleted: boolean;
};

export async function GET() {
  try {
    const info = await jellyfinJson<PublicSystemInfo>("/System/Info/Public");
    return NextResponse.json({
      connected: true,
      serverName: info.ServerName,
      version: info.Version,
      ready: info.StartupWizardCompleted,
    });
  } catch {
    return NextResponse.json(
      { connected: false, serverName: null, version: null, ready: false },
      { status: 503 },
    );
  }
}
