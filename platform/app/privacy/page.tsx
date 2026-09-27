import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="legalShell">
      <p className="eyebrow">APUDA · BETA PRIVACY NOTICE</p>
      <h1 className="pageTitle">건강정보 처리 안내</h1>
      <p className="heroCopy">
        ApuDa Health OS 베타에서 어떤 정보를 왜 다루는지 사용자가 이해하기 쉽게 정리한 안내입니다.
        정식 서비스 출시 전에는 관할 법률과 실제 운영 구조에 맞춘 최종 개인정보처리방침 검토가 필요합니다.
      </p>

      <section className="legalCard">
        <h2>어떤 정보를 저장하나요?</h2>
        <p>
          사용자가 직접 만든 프로필과 질환·치료·검사·증상·복약·병원 일정처럼 사용자가 선택해 입력한 건강기록을 저장합니다.
          필요한 정보만 단계적으로 받으며, 입력하지 않은 정보는 요구하지 않습니다.
        </p>

        <h2>사진과 음성은 어떻게 처리하나요?</h2>
        <p>
          검사결과 사진과 음성 기록은 구조화된 기록을 만들기 위한 임시 입력으로 처리합니다.
          AI 입력 서비스는 원본 파일을 작업 후 삭제하도록 설계되어 있으며, 인식 결과는 사용자가 확인하기 전에는 건강기록으로 저장하지 않습니다.
        </p>

        <h2>가족 프로필은 언제 만들 수 있나요?</h2>
        <p>
          본인 또는 사용자가 건강정보를 관리할 정당한 권한을 가진 가족·보호 대상의 프로필만 만들어야 합니다.
          다른 사람의 건강정보를 권한 없이 등록해서는 안 됩니다.
        </p>

        <h2>ApuDa가 하지 않는 일</h2>
        <p>
          ApuDa는 건강기록을 정리하고 설명과 진료 준비를 돕는 도구이며, 의료진의 진단·처방·약 중단 또는 용량 변경 결정을 대신하지 않습니다.
        </p>

        <h2>보안 원칙</h2>
        <p>
          계정별 Row Level Security, 최소권한 접근, 서버 전용 비밀키 분리, 원본 AI 입력의 임시 처리, 민감정보를 운영 로그에 남기지 않는 구조를 기본 원칙으로 사용합니다.
        </p>
      </section>

      <Link className="secondaryLink" href="/onboarding">프로필 만들기로 돌아가기</Link>
    </main>
  );
}
