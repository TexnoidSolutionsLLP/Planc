import { OverviewView } from "../../[store]/overview/overview-view";
import { demoOverview } from "../fixtures";

export default function DevPreviewOverview({ searchParams }: { searchParams: { range?: string } }) {
  const days = ["7", "30", "90"].includes(searchParams.range ?? "") ? Number(searchParams.range) : 30;
  return <OverviewView {...demoOverview(days)} />;
}
