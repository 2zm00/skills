import MainServerContainer from "@/container/Main/MainServerContainer";
import { pageMeta } from "@/configs/contents/seoContent";
import { buildMetadata } from "@/utils/metadata";

// page.tsx는 메타데이터와 ServerContainer 호출만 둔다. UI·기능은 container에서.
export const metadata = buildMetadata(pageMeta.main);

export default function Main() {
  return (
    <>
      <MainServerContainer />
    </>
  );
}
