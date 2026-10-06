import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectForm } from "@/features/projects/components/project-form";

export const metadata: Metadata = { title: "프로젝트 만들기" };

interface NewProjectPageProps {
  searchParams: Promise<{ created?: string | string[] }>;
}

const successSearchParamSchema = z.literal("1");

export default async function NewProjectPage({
  searchParams,
}: NewProjectPageProps) {
  const { created } = await searchParams;
  const projectCreated = successSearchParamSchema.safeParse(created).success;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Projects"
        title="새 프로젝트 만들기"
        description="목표와 기간을 정하고 개발 작업을 체계적으로 관리해 보세요."
      />
      {projectCreated ? (
        <Card className="border-success/30 bg-success-soft shadow-none">
          <CardContent className="flex items-start gap-3 py-5 sm:py-6">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-success"
            />
            <div>
              <p className="font-semibold text-foreground">프로젝트를 만들었습니다.</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                이어서 다른 프로젝트를 만들거나 프로젝트 화면으로 돌아갈 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <ProjectForm />
    </div>
  );
}
