"use client";

export default function PrintButton() {
  return (
    <button className="primaryButton noPrint" type="button" onClick={() => window.print()}>
      인쇄 / PDF 저장
    </button>
  );
}
