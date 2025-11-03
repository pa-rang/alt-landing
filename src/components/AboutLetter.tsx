import Link from "next/link";

type AboutLetterProps = {
  locale: string;
};

export function AboutLetter({ locale }: AboutLetterProps) {
  return (
    <div className="mt-20">
      <h3 className="text-2xl font-bold text-zinc-800 mb-5">
        {locale === "ko" && "KAIST 학생이 직접 쓰려고 만든 AI 강의 필기앱"}
      </h3>
      <div className="whitespace-pre-line leading-relaxed tracking-tighter mb-4 font-mono">
        {locale === "ko" ? (
          <>
            {`AI Lecture NoteTaker, Alt는
학교 수업을 들을 때, speech-to-text 모델을 직접 돌려 필기한다는 친구로부터 시작했습니다.

대부분의 AI 필기앱은 사용시간 제한이 있어 강의 3-4개를 들으면 한도를 초과하고,
글로벌 무료 앱들은 한국어 지원이 잘 안된다고 하더라고요.

가볍게 만들어볼 수 있을 것 같아 작은 프로젝트로 시작했습니다. 어떤 고통이 기다리고 있는지 모른 채로요...
메모리 사용량을 줄이면서 높은 성능을 내는 것이 생각보다 어려웠어요.
덕분에 `}
            <a
              href="https://github.com/altalt-org/Lightning-SimulWhisper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary underline"
            >
              오픈소스
            </a>
            {`까지 만들게 되었네요😂 (star 눌러주시면 감사합니다)

결국 한달동안 틈틈히 시간을 내어 완성했습니다.

제가 수업을 들을 땐 이런 AI 툴이 없었고, 영어 수업을 듣고 공부하는게 너무 고통스러웠는데
이런 서비스가 있었다면 훨씬 수월하게 공부하지 않았을까 싶어요.

많은 대학생 분들이 쉽게 강의를 듣고 공부했으면 좋겠다는 마음으로 이 서비스를 만든만큼,
완전 무료로 제공합니다. 서버나 API가 없기 때문에 다행히 가능하네요.

유용하게 써주시길 바라며,
아직 부족한 점이 많을텐데, `}
            <Link href={`/${locale}/feedback`} className="text-primary/70 hover:text-primary underline">
              피드백
            </Link>
            {` 많이 주시면 저희가 열심히 개선해보겠습니다😊

감사합니다.
`}
            <Link href={`/${locale}/about`} className="text-primary/70 hover:text-primary underline">
              alt 팀
            </Link>
            {` 드림`}
          </>
        ) : (
          <>
            {`Alt was started when I saw my friend transcribing and summarizing lectures using a speech-to-text model.

Most AI note-taking apps have time limits. They run out after taking 3–4 lectures.

This started as a small project as I thought it would be easy without knowing what kind of pain was waiting for me.
It was hard to achieve high performance while reducing memory usage.
I even made an `}
            <a
              href="https://github.com/altalt-org/Lightning-SimulWhisper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary underline"
            >
              open-source project
            </a>
            {` (stars appreciated!)

When I was taking classes, there weren't tools like this, and it was hard to listen while taking notes manually.
If a service like this had existed, it would've made my life much easier.

We want students around the world to study more easily.
It is completely free.
That's possible because we don't run any servers or rely on paid APIs.

We hope it's useful for you.
There are still rough edges, so please send lots of `}
            <Link href={`/${locale}/feedback`} className="text-primary/70 hover:text-primary underline">
              feedback
            </Link>
            {`, and we'll keep improving 😊

Thank you.
`}
            <Link href={`/${locale}/about`} className="text-primary/70 hover:text-primary underline">
              alt team
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
