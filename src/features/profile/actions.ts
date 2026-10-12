"use server";

import { revalidatePath } from "next/cache";

import { auth, updateSession } from "@/auth";
import { updateProfileSchema, type UpdateProfileActionState } from "./schemas";
import { updateProfile } from "./services/update-profile";

export async function updateProfileAction(
  _previousState: UpdateProfileActionState,
  formData: FormData,
): Promise<UpdateProfileActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { message: "로그인이 필요합니다. 다시 로그인해 주세요." };
  }

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio"),
    githubUrl: formData.get("githubUrl"),
    timezone: formData.get("timezone"),
    primaryTechnologies: formData
      .getAll("primaryTechnologies")
      .filter((value): value is string => typeof value === "string" && value !== ""),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let updated = false;
  try {
    updated = await updateProfile(session.user.id, parsed.data);
  } catch {
    return { message: "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  if (!updated) {
    return { message: "프로필을 찾을 수 없습니다. 다시 로그인해 주세요." };
  }

  try {
    await updateSession({});
  } catch {
    // 프로필 저장은 완료되었으므로 다음 로그인에서 세션 이름을 다시 동기화한다.
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/learning");
  return { success: true, message: "프로필을 저장했습니다." };
}
