import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireActiveUser } from "@/lib/auth";

const DATA_FILE = path.join(
  process.cwd(),
  "..",
  "AI스토리",
  "data",
  "story_requests.json"
);

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // 인증: 로그인 필수
  const auth = requireActiveUser();
  if (auth.response) return auth.response;
  const user = auth.user;
  if (user.role !== "creator" && user.role !== "admin") return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });

  const { id } = params;
  const body = await req.json();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    const idx = data.findIndex((r: { id: string }) => r.id === id);
    if (idx < 0) return NextResponse.json({ error: "not found" }, { status: 404 });

    const item = data[idx];
    const now = Date.now();

    if (body.action === "join") {
      if (user.role !== "creator") return NextResponse.json({ error: "크리에이터만 참여할 수 있습니다." }, { status: 403 });
      if (item.status !== "approved" || item.creator_id) return NextResponse.json({ error: "이미 배정되었거나 참여할 수 없는 의뢰입니다." }, { status: 409 });
      item.status = "in_progress";
      // creator_id와 creator_name은 세션에서 가져옴
      item.creator_id = user.id;
      item.creator_name = user.name;
    } else if (body.action === "complete") {
      if (user.role !== "creator" || item.creator_id !== user.id || item.status !== "in_progress") return NextResponse.json({ error: "본인에게 배정된 진행 중 의뢰만 완료할 수 있습니다." }, { status: 403 });
      item.status = "completed";
      item.completed_at = now;
    } else {
      return NextResponse.json({ error: "지원하지 않는 action입니다." }, { status: 400 });
    }

    data[idx] = item;
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
