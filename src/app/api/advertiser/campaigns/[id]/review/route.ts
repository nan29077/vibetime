import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { tx } from "@/lib/db";
import { markVideoDistributed, syncCampaignVideos } from "@/lib/distribution";
import { creatorDeployPayout, creatorVideoPayout } from "@/lib/queries";
import { addWalletTxOnce, audit, notifyUser } from "@/lib/services";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (user.role !== "advertiser" && user.role !== "admin") {
    return NextResponse.json({ error: "승인 권한이 없습니다." }, { status: 403 });
  }
  const input = (await req.json().catch(() => ({}))) as {
    creator_id?: string; type?: "video" | "deploy"; action?: "approve" | "reject"; reason?: string;
  };
  if (!input.creator_id || !["video", "deploy"].includes(input.type ?? "") || !["approve", "reject"].includes(input.action ?? "")) {
    return NextResponse.json({ error: "creator_id, type, action 값이 올바르지 않습니다." }, { status: 400 });
  }

  const result = tx<{ status: number; body: unknown }>((db) => {
    const campaign = db.ad_campaigns.find((item) => item.id === params.id);
    if (!campaign) return { status: 404, body: { error: "캠페인을 찾을 수 없습니다." } };
    if (user.role === "advertiser" && campaign.advertiser_id !== user.id) {
      return { status: 403, body: { error: "본인 캠페인만 승인할 수 있습니다." } };
    }
    const participationType = input.type === "video" ? "video_production" : "deploy";
    const participation = (db.campaign_participations ?? []).find(
      (item) => item.campaign_id === campaign.id && item.creator_id === input.creator_id && (item.participation_type ?? "deploy") === participationType
    );
    if (!participation) return { status: 404, body: { error: "해당 유형의 참여 기록을 찾을 수 없습니다." } };

    const expectedStatus = input.type === "video" ? "video_submitted" : "deploy_submitted";
    if (participation.status !== expectedStatus) {
      return { status: 409, body: { error: `현재 상태(${participation.status})에서는 검토할 수 없습니다.` } };
    }
    if (input.action === "reject") {
      participation.status = input.type === "video" ? "video_rejected" : "deploy_rejected";
      participation.rejection_reason = input.reason?.trim() || "반려 처리되었습니다.";
    } else {
      participation.status = "completed";
      participation.rejection_reason = undefined;
      if (input.type === "video") syncCampaignVideos(db, campaign);
      else markVideoDistributed(db, participation.id);
      addWalletTxOnce(db, {
        userId: participation.creator_id,
        type: "campaign_reward",
        amount: input.type === "video"
          ? creatorVideoPayout(db, campaign.video_duration_tier)
          : creatorDeployPayout(db, campaign.platforms),
        status: "available",
        relatedTable: "campaign_participations",
        relatedId: participation.id,
        memo: `${input.type === "video" ? "영상제작" : "배포"} 완료 수익: ${campaign.title}`,
      });
    }
    participation.updated_at = new Date().toISOString();
    notifyUser(db, {
      recipientId: participation.creator_id,
      title: input.action === "approve" ? "캠페인 작업이 승인되었습니다" : "캠페인 작업이 반려되었습니다",
      message: `${campaign.title} · 현재 상태: ${participation.status}${participation.rejection_reason ? ` · ${participation.rejection_reason}` : ""}`,
      link: "/creator/campaigns",
    });
    audit(db, { actorId: user.id, action: `participation_${input.action}`, targetTable: "campaign_participations", targetId: participation.id });
    return { status: 200, body: participation };
  });
  return NextResponse.json(result.body, { status: result.status });
}
