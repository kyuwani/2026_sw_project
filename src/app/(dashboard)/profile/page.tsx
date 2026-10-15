import { ExternalLink, GitBranch, LinkIcon, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "@/features/profile/components/profile-form";
import { getProfile } from "@/features/profile/queries";

export const metadata: Metadata = { title: "프로필" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getProfile(session.user.id);
  if (!profile) {
    notFound();
  }

  const displayName = profile.name || profile.email || "사용자";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Profile"
        title="프로필"
        description="공개 정보와 집계 기준, 연결된 계정을 관리합니다."
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ProfileForm profile={profile} />

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>프로필 미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {profile.imageUrl ? (
                  <Image
                    alt={`${displayName} 프로필 이미지`}
                    className="size-16 rounded-full border border-border object-cover"
                    height={64}
                    src={profile.imageUrl}
                    width={64}
                  />
                ) : (
                  <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-primary">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground">
                    {displayName}
                  </p>
                  <p className="mt-1 truncate text-sm text-muted">
                    {profile.email ?? "등록된 이메일 없음"}
                  </p>
                </div>
              </div>

              {profile.bio ? (
                <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {profile.bio}
                </p>
              ) : null}

              {profile.primaryTechnologies.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {profile.primaryTechnologies.map((technology) => (
                    <Badge key={technology} variant="outline">
                      {technology}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {profile.githubUrl ? (
                <Link
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover"
                  href={profile.githubUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <LinkIcon aria-hidden="true" className="size-4" />
                  GitHub 프로필
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </Link>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>연결된 계정</CardTitle>
              <CardDescription>
                Repository 조회에 사용하는 GitHub OAuth 상태입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4 rounded-control border border-border px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <GitBranch aria-hidden="true" className="size-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">GitHub</p>
                    <p className="mt-0.5 break-words text-xs text-muted">
                      {profile.githubConnected
                        ? "OAuth 계정이 연결되어 있습니다."
                        : "연결된 OAuth 계정이 없습니다."}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={profile.githubConnected ? "success" : "neutral"}
                >
                  {profile.githubConnected ? "연결됨" : "미연결"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="flex gap-3 pt-5 sm:pt-6">
              <UserRound
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-muted"
              />
              <p className="text-sm leading-6 text-muted">
                프로필 이미지는 연결된 GitHub 계정의 공식 avatar만 표시합니다.
                MVP에서는 별도 이미지 업로드를 지원하지 않습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
