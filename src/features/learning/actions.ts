"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getUserTimeZone } from "./queries";
import {
  createLearningLogInputSchema,
  learningLogIdSchema,
  type DeleteLearningLogActionState,
  type LearningLogFormActionState,
} from "./schemas";
import { createLearningLog } from "./services/create-learning-log";
import { deleteLearningLog } from "./services/delete-learning-log";
import { updateLearningLog } from "./services/update-learning-log";

function getLearningLogFormValues(formData: FormData) {
  return {
    title: formData.get("title"),
    content: formData.get("content"),
    studiedAt: formData.get("studiedAt"),
    studyHours: formData.get("studyHours"),
    studyMinutesPart: formData.get("studyMinutesPart"),
    category: formData.get("category"),
    technologyNames: formData.getAll("technologyNames"),
  };
}

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

  const parsed = createLearningLogInputSchema({ timeZone }).safeParse(
    getLearningLogFormValues(formData),
  );

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

export async function updateLearningLogAction(
  learningLogId: string,
  _previousState: LearningLogFormActionState,
  formData: FormData,
): Promise<LearningLogFormActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsedId = learningLogIdSchema.safeParse(learningLogId);

  if (!parsedId.success) {
    return { message: "학습 기록을 찾을 수 없거나 수정 권한이 없습니다." };
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

  const parsedInput = createLearningLogInputSchema({ timeZone }).safeParse(
    getLearningLogFormValues(formData),
  );

  if (!parsedInput.success) {
    return { fieldErrors: parsedInput.error.flatten().fieldErrors };
  }

  let updated = false;

  try {
    updated = await updateLearningLog(
      session.user.id,
      parsedId.data,
      parsedInput.data,
    );
  } catch {
    return {
      message: "학습 기록을 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (!updated) {
    return { message: "학습 기록을 찾을 수 없거나 수정 권한이 없습니다." };
  }

  revalidatePath("/learning");
  revalidatePath(`/learning/${parsedId.data}`);
  revalidatePath("/dashboard");
  redirect(`/learning/${parsedId.data}?updated=1`);
}

export async function deleteLearningLogAction(
  learningLogId: string,
  _previousState: DeleteLearningLogActionState,
  _formData: FormData,
): Promise<DeleteLearningLogActionState> {
  void _formData;
  const session = await auth();

  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsedId = learningLogIdSchema.safeParse(learningLogId);

  if (!parsedId.success) {
    return { message: "학습 기록을 찾을 수 없거나 삭제 권한이 없습니다." };
  }

  let deleted = false;

  try {
    deleted = await deleteLearningLog(session.user.id, parsedId.data);
  } catch {
    return {
      message: "학습 기록을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  if (!deleted) {
    return { message: "학습 기록을 찾을 수 없거나 삭제 권한이 없습니다." };
  }

  revalidatePath("/learning");
  revalidatePath("/dashboard");
  redirect("/learning?deleted=1");
}
