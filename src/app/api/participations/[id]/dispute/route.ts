import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { tx } from "@/lib/db";
import { audit, notifyUser } from "@/lib/services";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const input = (await req.json().catch(() => ({}))) as { reason?: string };
  const reason = input.reason?.trim() ?? "";
  if (reason.length < 10 || reason.length > 2000) return NextResponse.json({ error: "분쟁 사유는 10~2000자로 입력하세요." }, { status: 400 });
  const result = tx<{ status: number; body: unknown }>((db) => {
    const participation = (db.campaign_participations ?? []).find((item) => item.id === params.id);
    if (!participation) return { status: 404, body: { error: "참여 기록을 찾을 수 없습니다." } };
    const campaign = db.ad_campaigns.find((item) => item.id === participation.campaign_id);
    if (!campaign) return { status: 404, body: { error: "캠페인을 찾을 수 없습니다." } };
    const allowed = user.role === "admin" || participation.creator_id === user.id || (user.role === "advertiser" && campaign.advertiser_id === user.id);
    if (!allowed) return { status: 403, body: { error: "분쟁 신청 권한이 없습니다." } };
    if (!["video_submitted", "deploy_submitted", "video_rejected", "deploy_rejected", "completed"].includes(participation.status)) {
      return { status: 409, body: { error: "현재 상태에서는 분쟁을 신청할 수 없습니다." } };
    }
    participation.dispute_previous_status = participation.status;
    participation.status = "disputed";
    participation.rejection_reason = `분쟁 신청: ${reason}`;
    participation.updated_at = new Date().toISOString();
    const recipients = new Set<string>([participation.creator_id, campaign.advertiser_id, ...db.profiles.filter((item) => item.role === "admin").map((item) => item.id)]);
    recipients.delete(user.id);
    for (const recipientId of recipients) notifyUser(db, { recipientId, title: "캠페인 분쟁이 접수되었습니다", message: `${campaign.title} · ${reason.slice(0, 150)}`, link: user.role === "creator" ? `/advertiser/campaigns/${campaign.id}` : "/creator/campaigns" });
    audit(db, { actorId: user.id, action: "open_participation_dispute", targetTable: "campaign_participations", targetId: participation.id, after: { reason } });
    return { status: 200, body: participation };
  });
  return NextResponse.json(result.body, { status: result.status });
}
