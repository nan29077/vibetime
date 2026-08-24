"use server";

import { revalidatePath } from "next/cache";
import { tx } from "../db";
import { requireAdmin, requireRole } from "../auth";
import { genId } from "../crypto";
import { audit, notifyUser } from "../services";
import type { SocialPlatform } from "../schema";

const now = () => new Date().toISOString();

export async function addSocialAction(fd: FormData): Promise<void> {
  const user = requireRole("creator");
  const platform = String(fd.get("platform") || "youtube") as SocialPlatform;
  const accountName = String(fd.get("account_name") || "").trim();
  const channelUrl = String(fd.get("channel_url") || "").trim();
  const followerCount = Math.max(0, Math.floor(Number(fd.get("follower_count") || 0)));
  if (!accountName || !channelUrl) return;
  tx((db) => {
    db.social_accounts.push({
      id: genId(),
      creator_id: user.id,
      platform,
      account_name: accountName,
      channel_url: channelUrl,
      follower_count: followerCount,
      verified_status: "unverified",
      created_at: now(),
      updated_at: now(),
    });
  });
  revalidatePath("/creator/social");
  revalidatePath("/creator/community");
}

export async function deleteSocialAction(fd: FormData): Promise<void> {
  const user = requireRole("creator");
  const id = String(fd.get("id") || "");
  tx((db) => {
    db.social_accounts = db.social_accounts.filter(
      (s) => !(s.id === id && s.creator_id === user.id)
    );
  });
  revalidatePath("/creator/social");
  revalidatePath("/creator/community");
}

// === ADMIN: SNS 채널 인증 승인/해제 =====================================
// 캠페인 참여 자격(campaignEligibility)은 verified 채널만 인정하므로,
// 관리자가 채널을 확인한 뒤 이 액션으로 인증 상태를 부여한다.
function setSocialVerifiedStatus(
  accountId: string,
  status: "verified" | "unverified"
): void {
  const admin = requireAdmin();
  if (!accountId) return;
  const creatorId = tx<string | null>((db) => {
    const account = db.social_accounts.find((s) => s.id === accountId);
    if (!account || account.verified_status === status) return null;
    const before = account.verified_status;
    account.verified_status = status;
    account.updated_at = now();
    audit(db, {
      actorId: admin.id,
      action: status === "verified" ? "verify_social_account" : "unverify_social_account",
      targetTable: "social_accounts",
      targetId: account.id,
      before: { verified_status: before },
      after: { verified_status: status },
    });
    notifyUser(db, {
      recipientId: account.creator_id,
      title: status === "verified" ? "SNS 채널이 인증되었습니다" : "SNS 채널 인증이 해제되었습니다",
      message: `${account.account_name} 채널의 인증 상태가 변경되었습니다.`,
      link: "/creator/social",
    });
    return account.creator_id;
  });
  if (!creatorId) return;
  revalidatePath(`/admin/members/${creatorId}`);
  revalidatePath("/admin/members");
  revalidatePath("/creator/social");
  revalidatePath("/creator/community");
}

/** 관리자: SNS 채널을 인증(verified) 처리 */
export async function verifySocialAccountAction(accountId: string): Promise<void> {
  setSocialVerifiedStatus(accountId, "verified");
}

/** 관리자: SNS 채널 인증 해제(unverified) */
export async function unverifySocialAccountAction(accountId: string): Promise<void> {
  setSocialVerifiedStatus(accountId, "unverified");
}
