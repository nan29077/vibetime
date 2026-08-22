import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { tx } from "@/lib/db";
import { audit, notifyUser } from "@/lib/services";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (user.role !== "creator") return NextResponse.json({ error: "크리에이터 권한이 필요합니다." }, { status: 403 });
  const result = tx<{ status: number; body: unknown }>((db) => {
    const participation = (db.campaign_participations ?? []).find((item) => item.id === params.id);
    if (!participation) return { status: 404, body: { error: "참여 기록을 찾을 수 없습니다." } };
    if (participation.creator_id !== user.id) return { status: 403, body: { error: "본인 참여만 취소할 수 있습니다." } };
    if (!["applied", "accepted", "video_rejected", "deploy_rejected"].includes(participation.status)) {
      return { status: 409, body: { error: "작업 제출 이후에는 직접 취소할 수 없습니다. 관리자에게 문의하세요." } };
    }
    participation.status = "cancelled";
    participation.updated_at = new Date().toISOString();
    const video = (db.campaign_videos ?? []).find((item) => item.assigned_participation_id === participation.id && item.status !== "distributed");
    if (video) {
      video.status = "unassigned"; video.assigned_creator_id = null; video.assigned_participation_id = null;
      video.assigned_at = null; video.downloaded_at = null;
    }
    const campaign = db.ad_campaigns.find((item) => item.id === participation.campaign_id);
    if (campaign) notifyUser(db, { recipientId: campaign.advertiser_id, title: "크리에이터가 참여를 취소했습니다", message: campaign.title, link: `/advertiser/campaigns/${campaign.id}` });
    audit(db, { actorId: user.id, action: "cancel_participation", targetTable: "campaign_participations", targetId: participation.id });
    return { status: 200, body: participation };
  });
  return NextResponse.json(result.body, { status: result.status });
}
