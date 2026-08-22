import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { tx } from "@/lib/db";
import { markVideoDistributed, syncCampaignVideos } from "@/lib/distribution";
import { creatorDeployPayout, creatorVideoPayout } from "@/lib/queries";
import { addWalletTxOnce, audit, notifyUser } from "@/lib/services";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getCurrentUser();
  if (!admin) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  const input = (await req.json().catch(() => ({}))) as { decision?: "restore" | "complete" | "cancel"; memo?: string };
  if (!input.decision || !["restore", "complete", "cancel"].includes(input.decision)) return NextResponse.json({ error: "처리 결정을 확인하세요." }, { status: 400 });
  const result = tx<{ status: number; body: unknown }>((db) => {
    const participation = (db.campaign_participations ?? []).find((item) => item.id === params.id);
    if (!participation || participation.status !== "disputed") return { status: 404, body: { error: "처리할 분쟁을 찾을 수 없습니다." } };
    const campaign = db.ad_campaigns.find((item) => item.id === participation.campaign_id);
    if (!campaign) return { status: 404, body: { error: "캠페인을 찾을 수 없습니다." } };
    if (input.decision === "restore") participation.status = participation.dispute_previous_status ?? "accepted";
    if (input.decision === "cancel") {
      const paidReward = db.wallet_transactions.some((item) => item.related_table === "campaign_participations" && item.related_id === participation.id && item.status !== "cancelled");
      if (paidReward) return { status: 409, body: { error: "이미 지급된 수익이 있어 취소 전 관리자 정산 조정이 필요합니다." } };
      participation.status = "cancelled";
    }
    if (input.decision === "complete") {
      participation.status = "completed";
      if ((participation.participation_type ?? "deploy") === "video_production") syncCampaignVideos(db, campaign); else markVideoDistributed(db, participation.id);
      addWalletTxOnce(db, { userId: participation.creator_id, type: "campaign_reward", amount: (participation.participation_type ?? "deploy") === "video_production" ? creatorVideoPayout(db, campaign.video_duration_tier) : creatorDeployPayout(db, campaign.platforms), status: "available", relatedTable: "campaign_participations", relatedId: participation.id, memo: `분쟁 조정 완료 수익: ${campaign.title}` });
    }
    participation.rejection_reason = input.memo?.trim() || undefined;
    participation.dispute_previous_status = undefined;
    participation.updated_at = new Date().toISOString();
    for (const recipientId of [participation.creator_id, campaign.advertiser_id]) notifyUser(db, { recipientId, title: "캠페인 분쟁 처리가 완료되었습니다", message: `${campaign.title} · ${input.decision}`, link: recipientId === participation.creator_id ? "/creator/campaigns" : `/advertiser/campaigns/${campaign.id}` });
    audit(db, { actorId: admin.id, action: `resolve_participation_dispute_${input.decision}`, targetTable: "campaign_participations", targetId: participation.id, after: { memo: input.memo } });
    return { status: 200, body: participation };
  });
  return NextResponse.json(result.body, { status: result.status });
}
