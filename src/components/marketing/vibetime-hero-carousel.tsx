"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconChevronLeft, IconChevronRight, IconPlay } from "@/components/icons";

const slides = [
  { image: "/images/hero/side-income-generated-1.webp", eyebrow: "YOUR TIME TO CREATE", title: <><span className="vt-hero-title-line">숏폼으로 나만의</span><span className="vt-hero-title-line"><em>기회를 시작하세요</em></span></>, body: "AI 영상 제작 · 숏폼 배포 · 추천 수당. 바이브타임의 세 가지 수익 파이프라인을 한 곳에서 시작합니다." },
  { image: "/images/hero/side-income-generated-2.webp", eyebrow: "CREATE & SHARE", title: <>하루 한 편,<br /><em>수익의 씨앗</em>을 심어요</>, body: "영상 경험이 없어도 괜찮아요. 가이드를 따라 만들고, 여러 플랫폼으로 배포하며 수익 기회를 넓혀보세요." },
  { image: "/images/hero/side-income-generated-3.webp", eyebrow: "BUILD YOUR MOMENTUM", title: <>쌓일수록 선명해지는<br /><em>월 수익 로드맵</em></>, body: "입문부터 숙련까지, 바이브타임 수익 로드맵과 시뮬레이션을 확인하며 내 속도로 성장할 수 있어요." },
];

export function VibeTimeHeroCarousel({ ctaHref = "/signup" }: { ctaHref?: string }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => (value + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, []);
  const go = (direction: number) => setActive((active + direction + slides.length) % slides.length);

  return (
    <section className="vt-vibe-hero" aria-roledescription="carousel" aria-label="바이브타임 숏폼 부업 소개">
      {slides.map((slide, index) => (
        <div key={slide.image} className={`vt-hero-slide ${index === active ? "is-active" : ""}`} aria-hidden={index !== active}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slide.image} alt="숏폼 콘텐츠를 제작하는 크리에이터" className="vt-hero-image" />
          <div className="vt-hero-shade" />
          <div className="vt-timegrid" aria-hidden />
          <div className="vt-hero-copy">
            <p className="vt-hero-eyebrow"><span />{slide.eyebrow}</p>
            <h1>{slide.title}</h1>
            <p className="vt-hero-body">{slide.body}</p>
            <div className="vt-hero-actions">
              <Link href={ctaHref} className="vt-vibe-button">지금 바로 시작하기 <IconPlay size={15} /></Link>
            </div>
          </div>
        </div>
      ))}
      <div className="vt-hero-arrows" aria-label="배너 이동">
        <button type="button" onClick={() => go(-1)} aria-label="이전 슬라이드"><IconChevronLeft size={22} /></button>
        <button type="button" onClick={() => go(1)} aria-label="다음 슬라이드"><IconChevronRight size={22} /></button>
      </div>
      <div className="vt-hero-dots vt-hero-pagination">{slides.map((slide, index) => <button key={slide.image} onClick={() => setActive(index)} aria-label={`${index + 1}번 슬라이드`} className={active === index ? "is-active" : ""} />)}</div>
    </section>
  );
}
