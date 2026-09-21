export interface MockProject {
  id: string;
  name: string;
  description: string;
  progress: number;
  dueDate: string;
  technologies: string[];
}

export interface MockTask {
  id: string;
  title: string;
  project: string;
  dueLabel: string;
  priority: "높음" | "보통";
}

export interface MockLearningLog {
  id: string;
  title: string;
  category: string;
  duration: string;
  date: string;
}

export const projects: MockProject[] = [
  {
    id: "project-1",
    name: "DevLog MVP",
    description: "개발 활동을 한곳에서 관리하는 개인 대시보드",
    progress: 42,
    dueDate: "10월 31일",
    technologies: ["Next.js", "TypeScript"],
  },
  {
    id: "project-2",
    name: "알고리즘 스터디",
    description: "주 5회 문제 풀이와 회고 기록",
    progress: 68,
    dueDate: "12월 14일",
    technologies: ["Python", "Algorithms"],
  },
  {
    id: "project-3",
    name: "포트폴리오 리뉴얼",
    description: "프로젝트 경험을 중심으로 포트폴리오 개편",
    progress: 24,
    dueDate: "11월 22일",
    technologies: ["React", "Tailwind CSS"],
  },
];

export const upcomingTasks: MockTask[] = [
  {
    id: "task-1",
    title: "Dashboard 와이어프레임 완성",
    project: "DevLog MVP",
    dueLabel: "오늘",
    priority: "높음",
  },
  {
    id: "task-2",
    title: "그래프 탐색 문제 3개 풀이",
    project: "알고리즘 스터디",
    dueLabel: "내일",
    priority: "보통",
  },
  {
    id: "task-3",
    title: "프로젝트 소개 문구 다듬기",
    project: "포트폴리오 리뉴얼",
    dueLabel: "9월 24일",
    priority: "보통",
  },
];

export const learningLogs: MockLearningLog[] = [
  {
    id: "log-1",
    title: "Next.js App Router 구조 정리",
    category: "개발",
    duration: "1시간 40분",
    date: "오늘",
  },
  {
    id: "log-2",
    title: "BFS와 DFS 복습",
    category: "알고리즘",
    duration: "1시간 10분",
    date: "어제",
  },
  {
    id: "log-3",
    title: "PostgreSQL 인덱스 학습",
    category: "데이터베이스",
    duration: "50분",
    date: "9월 19일",
  },
];

export const weeklyStudy = [
  { day: "월", minutes: 80 },
  { day: "화", minutes: 120 },
  { day: "수", minutes: 60 },
  { day: "목", minutes: 150 },
  { day: "금", minutes: 100 },
  { day: "토", minutes: 45 },
  { day: "일", minutes: 95 },
];
