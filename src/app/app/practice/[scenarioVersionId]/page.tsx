import { PracticeRoom } from "@/components/practice-room";
export default async function Page({ params }: { params: Promise<{ scenarioVersionId: string }> }) {
  const { scenarioVersionId } = await params;
  return <PracticeRoom scenarioVersionId={scenarioVersionId} />;
}
