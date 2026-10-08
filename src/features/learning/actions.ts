"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getUserTimeZone } from "./queries";
import {
  createLearningLogInputSchema,
  type LearningLogFormActionState,
} from "./schemas";
import { createLearningLog } from "./services/create-learning-log";

export async function createLearningLogAction(
  _previousState: LearningLogFormActionState,
  formData: FormData,
): Promise<LearningLogFormActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  let timeZone: string | null = null;

  try {
    timeZone = await getUserTimeZone(session.user.id);
  } catch {
    return {
      message: "사용자 설정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (!timeZone) {
    return { message: "사용자 시간대 설정을 확인해 주세요." };
  }

  const parsed = createLearningLogInputSchema({ timeZone }).safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    studiedAt: formData.get("studiedAt"),
    studyHours: formData.get("studyHours"),
    studyMinutesPart: formData.get("studyMinutesPart"),
    category: formData.get("category"),
    technologyNames: formData.getAll("technologyNames"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createLearningLog(session.user.id, parsed.data);
  } catch {
    return {
      message: "학습 기록을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  redirect("/learning?created=1");
}
