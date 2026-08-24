import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireActiveUser } from "@/lib/auth";
import { getDb, tx } from "@/lib/db";
import { audit } from "@/lib/services";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireActiveUser();
  if (auth.response) return auth.response;
  const user = auth.user;
  const db = getDb();
  const campaign = db.ad_campaigns.find((item) => item.id === params.id);
  if (!campaign) return NextResponse.json({ error: "캠페인을 찾을 수 없습니다." }, { status: 404 });
  if (user.role === "advertiser" && campaign.advertiser_id !== user.id) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  // POST 와 동일한 기준으로 크리에이터 열람 권한을 검사한다.
  const creatorParticipates = (db.campaign_participations ?? []).some((item) => item.campaign_id === campaign.id && item.creator_id === user.id);
  if (user.role === "creator" && !creatorParticipates && !["published", "recruiting", "in_progress"].includes(campaign.status)) {
    return NextResponse.json({ error: "댓글 열람 권한이 없습니다." }, { status: 403 });
  }
  return NextResponse.json((db.campaign_comments ?? []).filter((item) => item.campaign_id === params.id));
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireActiveUser();
  if (auth.response) return auth.response;
  const user = auth.user;
  const input = (await req.json().catch(() => ({}))) as { content?: string };
  const content = input.content?.trim() ?? "";
  if (!content || content.length > 3000) return NextResponse.json({ error: "댓글은 1~3000자여야 합니다." }, { status: 400 });
  const result = tx<{ status: number; body: unknown }>((db) => {
    const campaign = db.ad_campaigns.find((item) => item.id === params.id);
    if (!campaign) return { status: 404, body: { error: "캠페인을 찾을 수 없습니다." } };
    const creatorParticipates = (db.campaign_participations ?? []).some((item) => item.campaign_id === campaign.id && item.creator_id === user.id);
    if (user.role === "advertiser" && campaign.advertiser_id !== user.id) return { status: 403, body: { error: "접근 권한이 없습니다." } };
    if (user.role === "creator" && !creatorParticipates && !["published", "recruiting", "in_progress"].includes(campaign.status)) return { status: 403, body: { error: "댓글 작성 권한이 없습니다." } };
    const comment = { id: nanoid(), campaign_id: campaign.id, author_id: user.id, author_name: user.name, author_role: user.role, content, created_at: new Date().toISOString() };
    if (!db.campaign_comments) db.campaign_comments = [];
    db.campaign_comments.push(comment);
    audit(db, { actorId: user.id, action: "comment_campaign", targetTable: "ad_campaigns", targetId: campaign.id });
    return { status: 200, body: comment };
  });
  return NextResponse.json(result.body, { status: result.status });
}
