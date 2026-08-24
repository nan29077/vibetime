import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { tx } from "@/lib/db";
import { releaseVideo } from "@/lib/distribution";
import { audit, notifyUser } from "@/lib/services";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const auth = requireActiveUser();
  if (auth.response) return auth.response;
  const user = auth.user;
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
    // 배정된 영상을 풀로 반납 (배포 완료된 영상은 releaseVideo 내부에서 제외)
    releaseVideo(db, participation.id);
    const campaign = db.ad_campaigns.find((item) => item.id === participation.campaign_id);
    if (campaign) notifyUser(db, { recipientId: campaign.advertiser_id, title: "크리에이터가 참여를 취소했습니다", message: campaign.title, link: `/advertiser/campaigns/${campaign.id}` });
    audit(db, { actorId: user.id, action: "cancel_participation", targetTable: "campaign_participations", targetId: participation.id });
    return { status: 200, body: participation };
  });
  return NextResponse.json(result.body, { status: result.status });
}
