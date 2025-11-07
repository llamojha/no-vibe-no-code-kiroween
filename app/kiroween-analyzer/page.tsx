import KiroweenAnalyzerView from "@/features/kiroween-analyzer/components/KiroweenAnalyzerView";
import { createHackathonAnalysisAction } from "@/app/actions/hackathon";

export const dynamic = "force-dynamic";

export default function KiroweenAnalyzerPage() {
  return <KiroweenAnalyzerView createHackathonAnalysisAction={createHackathonAnalysisAction} />;
}
