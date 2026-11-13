import MainClientContainer from "./MainClientContainer";
import MainServerBlock from "./MainServerBlock";

// 클라이언트 컨테이너가 서버 블록을 감싼다. 데이터 요청이 필요하면 utils/requestToSrv의 함수를 여기서 import해 부른다.
export default function MainServerContainer() {
  return (
    <MainClientContainer>
      <MainServerBlock />
    </MainClientContainer>
  );
}
