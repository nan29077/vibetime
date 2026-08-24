import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { tx } from "@/lib/db";
import { notifyUser } from "@/lib/services";

function isHttpUrl(value: string): boolean {
  if (/^\/api\/files\/[0-9a-f-]{36}$/.test(value)) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireActiveUser();
  if (auth.response) return auth.response;
  const user = auth.user;
  if (user.role !== "creator") return NextResponse.json({ error: "크리에이터 권한이 필요합니다." }, { status: 403 });

  const input = (await req.json().catch(() => ({}))) as {
    type?: "video" | "deploy";
    video_url?: string;
    video_file_data?: string;
    video_file_name?: string;
    video_file_type?: string;
    deploy_link?: string;
    note?: string;
  };
  if (input.type !== "video" && input.type !== "deploy") {
    return NextResponse.json({ error: "type은 video 또는 deploy여야 합니다." }, { status: 400 });
  }
  const workUrl = (input.type === "video" ? input.video_url : input.deploy_link)?.trim() ?? "";
  if (!isHttpUrl(workUrl)) {
    return NextResponse.json({ error: "유효한 http(s) 작업물 URL이 필요합니다." }, { status: 400 });
  }

  const result = tx<{ status: number; body: unknown }>((db) => {
    const campaign = db.ad_campaigns.find((item) => item.id === params.id);
    if (!campaign) return { status: 404, body: { error: "캠페인을 찾을 수 없습니다." } };
    if (!["recruiting", "published", "in_progress"].includes(campaign.status)) {
      return { status: 409, body: { error: "진행 중인 캠페인만 제출할 수 있습니다." } };
    }
    if (campaign.end_date && new Date(campaign.end_date).getTime() < Date.now()) {
      return { status: 409, body: { error: "제출 기한이 종료되었습니다." } };
    }

    const participationType = input.type === "video" ? "video_production" : "deploy";
    const participation = (db.campaign_participations ?? []).find(
      (item) =>
        item.campaign_id === params.id &&
        item.creator_id === user.id &&
        (item.participation_type ?? "deploy") === participationType
    );
    if (!participation) return { status: 404, body: { error: "해당 유형의 참여 기록을 찾을 수 없습니다." } };

    const allowed = input.type === "video" ? ["accepted", "video_rejected"] : ["accepted", "deploy_rejected"];
    if (!allowed.includes(participation.status)) {
      return { status: 409, body: { error: "승인된 참여 건 또는 반려된 작업만 제출할 수 있습니다." } };
    }

    participation.rejection_reason = undefined;
    participation.updated_at = new Date().toISOString();
    if (input.type === "video") {
      participation.status = "video_submitted";
      participation.video_url = workUrl;
      participation.video_note = input.note?.trim() || undefined;
    } else {
      participation.status = "deploy_submitted";
      participation.deploy_link = workUrl;
      participation.deploy_note = input.note?.trim() || undefined;
    }
    notifyUser(db, { recipientId: campaign.advertiser_id, title: "캠페인 작업물이 제출되었습니다", message: `${campaign.title} · ${input.type === "video" ? "영상 제작" : "배포"}`, link: `/advertiser/campaigns/${campaign.id}` });
    return { status: 200, body: participation };
  });

  return NextResponse.json(result.body, { status: result.status });
}
