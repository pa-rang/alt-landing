import Link from "next/link";

type AboutLetterProps = {
  locale: string;
};

export function AboutLetter({ locale }: AboutLetterProps) {
  return (
    <div className="mt-20">
      <h3 className="text-2xl font-bold text-zinc-800 mb-5">
        {locale === "ko"
          ? "KAIST 학생이 직접 필요해서 만든 서비스"
          : "Built by a Korean engineering student, because we needed it"}
      </h3>
      <div className="whitespace-pre-line leading-relaxed tracking-tighter mb-4 font-mono">
        {locale === "ko" ? (
          <>
            {`AI Lecture NoteTaker, Alt는
학교 수업을 Speech to Text 모델을 직접 돌려서 듣는다는 친구로부터 시작했습니다.

대부분의 AI 필기앱은 시간 제한이 있어 강의 3-4개를 들으면 끝나고,
글로벌 무료 앱들은 한국어 지원이 잘 안되더라구요.

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
            {`Alt started when a friend told me they were using a speech-to-text model to keep up with lectures.

Most AI note-taking apps have time limits — they run out after 3–4 lectures.

I thought I could hack together a small project, not knowing the struggles ahead.
Reducing memory usage while keeping performance high was harder than I expected.
That led me to create an `}
            <a
              href="https://github.com/altalt-org/Lightning-SimulWhisper"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/70 hover:text-primary underline"
            >
              open-source project
            </a>
            {` (stars appreciated!)

In the end, I chipped away at it for a month and finished it.

Back when I was a student, there weren't tools like this, and studying in English was tough.
If a service like this had existed, it would've been much easier.

We want college students to study more easily, so it's completely free.
That's possible because we don't run servers or rely on paid APIs.

Hope it's useful.
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
