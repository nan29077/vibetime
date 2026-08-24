"use client";

import { useFormState } from "react-dom";
import { applyCampaignAction, submitCampaignProofAction } from "@/lib/actions/campaign-actions";
import { Field, Input, Textarea } from "@/components/ui";
import { SubmitButton, FormMessage, FieldError, initialActionState } from "@/components/form";
import { PLATFORM_LABELS, type SocialPlatform } from "@/lib/schema";

/** 캠페인 참여 신청 (campaign_applications 흐름) */
export function CampaignApplyForm({ campaignId }: { campaignId: string }) {
  const [state, formAction] = useFormState(applyCampaignAction, initialActionState);
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="campaign_id" value={campaignId} />
      <p className="text-sm text-gray-600">
        캠페인 참여를 신청하면 광고주가 검토 후 선발합니다. 승인되면 납품물을 제출할 수 있습니다.
      </p>
      <FormMessage state={state} />
      <SubmitButton size="sm">캠페인 참여 신청</SubmitButton>
    </form>
  );
}

/** 승인된 참여자의 납품 증빙 제출 */
export function CampaignProofForm({
  campaignId,
  platforms,
}: {
  campaignId: string;
  platforms: SocialPlatform[];
}) {
  const [state, formAction] = useFormState(submitCampaignProofAction, initialActionState);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="campaign_id" value={campaignId} />
      <Field label="플랫폼">
        <select
          name="platform"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-purple focus:outline-none"
        >
          {platforms.map((pl) => (
            <option key={pl} value={pl}>
              {PLATFORM_LABELS[pl]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="게시물 URL" required>
        <Input name="post_url" placeholder="https://youtube.com/shorts/..." required />
        <FieldError state={state} name="post_url" />
      </Field>
      <Field label="설명 메시지">
        <Textarea name="description" placeholder="납품 관련 메모, 특이사항 등을 입력하세요." rows={3} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton>납품 제출</SubmitButton>
    </form>
  );
}
