const URL_RE = /(https?:\/\/[^\s]+)/g

/**
 * 상담 내용 안에 포함된 첨부파일 URL(https://...)을 자동으로 클릭 가능한 링크로 바꿔줍니다.
 * 상담글 본문은 일반 텍스트로 저장되므로, 이 컴포넌트가 줄바꿈은 그대로 유지한 채
 * URL 부분만 <a> 태그로 변환해서 보여줍니다.
 *
 * (참고) split()에 캡처 그룹이 있는 정규식을 쓰면 매치된 부분이 홀수 인덱스에,
 * 매치되지 않은 일반 텍스트가 짝수 인덱스에 들어옵니다. 그래서 정규식을 반복
 * 실행(test)하지 않고 인덱스 홀/짝만으로 링크 여부를 판단합니다.
 */
export default function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_RE)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="content-link">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}
