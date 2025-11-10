"use client";

import { useState, useEffect, useRef, type ReactNode, isValidElement } from "react";
import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/button";

type ResponsiveButtonGroupProps = {
  children: ReactNode[];
  breakpoint?: number; // 픽셀 단위, 이 너비 이하에서 메뉴로 이동
};

// 버튼에서 링크와 텍스트 추출 (재귀적으로 탐색)
function extractButtonInfo(
  element: ReactNode,
  depth = 0
): { href?: string; text: string; icon?: ReactNode; onClick?: () => void } {
  if (depth > 5) return { text: "" }; // 무한 루프 방지
  if (!isValidElement(element)) {
    if (typeof element === "string") {
      return { text: element };
    }
    return { text: "" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = element.props as any;
  let href: string | undefined;
  let text = "";
  let icon: ReactNode | undefined;
  let onClick: (() => void) | undefined;

  // 직접 href가 있는 경우 (Link나 a 태그)
  if (props.href) {
    href = props.href;
    onClick = props.onClick;
  }

  // children 처리
  if (props.children) {
    const children = Array.isArray(props.children) ? props.children : [props.children];
    for (const child of children) {
      if (isValidElement(child)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const childType = child.type as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const childProps = child.props as any;

        // Link 컴포넌트인 경우
        if (childType?.displayName === "Link" || childType?.name === "Link" || childProps.href) {
          if (!href) href = childProps.href;
          if (!onClick) onClick = childProps.onClick;
        }

        // a 태그인 경우
        if (childType === "a" && childProps.href) {
          if (!href) href = childProps.href;
          if (!onClick) onClick = childProps.onClick;
        }

        // Image 컴포넌트인 경우
        if (childType === Image || (childProps.src && childProps.alt)) {
          icon = child;
        }

        // span 태그에서 텍스트 추출
        if (childType === "span") {
          if (typeof childProps.children === "string") {
            text = childProps.children;
          } else if (childProps.children) {
            const spanText = extractButtonInfo(childProps.children, depth + 1);
            if (spanText.text) text = spanText.text;
          }
        }

        // 재귀적으로 탐색
        const nested = extractButtonInfo(child, depth + 1);
        if (!href && nested.href) href = nested.href;
        if (!text && nested.text) text = nested.text;
        if (!icon && nested.icon) icon = nested.icon;
        if (!onClick && nested.onClick) onClick = nested.onClick;
      } else if (typeof child === "string") {
        if (!text) text = child;
      }
    }
  }

  return { href, text, icon, onClick };
}

export function ResponsiveButtonGroup({ children }: ResponsiveButtonGroupProps) {
  const [visibleCount, setVisibleCount] = useState(0); // 초기에는 아무것도 보이지 않음
  const [isCalculated, setIsCalculated] = useState(false); // 너비 계산 완료 여부
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hiddenButtonRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [buttonInfos, setButtonInfos] = useState<
    Array<{ href?: string; text: string; icon?: ReactNode; onClick?: () => void }>
  >([]);

  // 숨겨진 버튼들에서 정보 추출
  useEffect(() => {
    const infos = hiddenButtonRefs.current.map((ref) => {
      if (!ref) return { text: "" };

      // Link나 a 태그 찾기
      const link = ref.querySelector("a[href]") as HTMLAnchorElement | null;
      let href: string | undefined;

      if (link) {
        // 절대 URL인 경우 그대로 사용
        if (link.href.startsWith("http")) {
          href = link.href;
        } else {
          // 상대 경로인 경우 pathname 사용
          href = link.pathname + link.search;
        }
      }

      // 텍스트 추출 (버튼 내부의 텍스트만, 아이콘 제외)
      const textElements = ref.querySelectorAll("span");
      let text = "";
      for (const span of Array.from(textElements)) {
        const spanText = span.textContent?.trim();
        if (spanText && spanText.length > 0) {
          text = spanText;
          break;
        }
      }
      // span이 없으면 전체 텍스트에서 아이콘 텍스트 제거
      if (!text) {
        text = ref.textContent?.trim() || "";
      }

      // 아이콘 정보 추출
      const iconElement = ref.querySelector("img");
      let icon: ReactNode | undefined;
      if (iconElement) {
        const img = iconElement as HTMLImageElement;
        const src = img.src || img.getAttribute("src") || "";
        if (src) {
          // 절대 URL이 아니면 상대 경로로 변환
          const iconSrc = src.startsWith("http") ? src : src.replace(window.location.origin, "");
          icon = <Image src={iconSrc} alt={img.alt || ""} width={16} height={16} className="shrink-0" unoptimized />;
        }
      }

      return { href, text, icon };
    });

    setButtonInfos(infos);
  }, [visibleCount, children]);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const buttons = buttonRefs.current.filter(Boolean) as HTMLDivElement[];

      if (buttons.length === 0) return;

      let totalWidth = 0;
      const menuButtonWidth = 40; // 메뉴 버튼 예상 너비
      let count = 0;

      // 각 버튼의 너비를 측정하며 들어갈 수 있는지 확인
      for (let i = 0; i < buttons.length; i++) {
        const buttonWidth = buttons[i].offsetWidth;
        const gap = i > 0 ? 8 : 0; // space-x-2 = 8px

        // 메뉴 버튼이 필요한 경우를 고려
        const needsMenu = i < buttons.length - 1;
        const requiredWidth = totalWidth + buttonWidth + gap + (needsMenu ? menuButtonWidth : 0);

        if (requiredWidth <= containerWidth) {
          totalWidth += buttonWidth + gap;
          count++;
        } else {
          break;
        }
      }

      // 최소 1개는 보이도록 보장
      const newVisibleCount = Math.max(1, Math.min(count, children.length));
      setVisibleCount(newVisibleCount);
      setIsCalculated(true); // 계산 완료 표시
    };

    // 초기 계산을 위해 약간의 지연 추가 (DOM이 완전히 렌더링된 후)
    const timeoutId = setTimeout(() => {
      updateVisibleCount();
    }, 0);

    const resizeObserver = new ResizeObserver(() => {
      updateVisibleCount();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateVisibleCount);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateVisibleCount);
    };
  }, [children.length]);

  const hiddenButtons = children.slice(visibleCount);

  return (
    <>
      {/* 숨겨진 버튼들 - DOM에서 정보 추출용 */}
      <div className="fixed opacity-0 pointer-events-none -z-50" aria-hidden="true">
        {hiddenButtons.map((button, index) => (
          <div
            key={`hidden-${index}`}
            ref={(el) => {
              hiddenButtonRefs.current[index] = el;
            }}
          >
            {button}
          </div>
        ))}
      </div>
      <div ref={containerRef} className="flex items-center space-x-2 flex-1 justify-end min-w-0">
        {/* 모든 버튼을 먼저 렌더링하여 너비 측정 (초기에는 숨김) */}
        {children.map((child, index) => (
          <div
            key={index}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            className={isCalculated && index < visibleCount ? "shrink-0" : "shrink-0"}
            style={isCalculated && index < visibleCount ? {} : { position: "absolute", visibility: "hidden" }}
          >
            {child}
          </div>
        ))}
        {isCalculated && hiddenButtons.length > 0 && (
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 rounded-full shadow-none text-[13px] shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              {hiddenButtons.map((button, index) => {
                const info = buttonInfos[index] || extractButtonInfo(button);
                const { href, text, icon, onClick } = info;
                const isExternal = href?.startsWith("http");

                if (!href || !text) {
                  // 링크나 텍스트가 없으면 원본 버튼 렌더링 (LanguageSwitcher 같은 경우)
                  return (
                    <DropdownMenuItem key={visibleCount + index} className="p-0" asChild>
                      <div className="w-full">{button}</div>
                    </DropdownMenuItem>
                  );
                }

                const MenuItemContent = isExternal ? "a" : Link;
                const menuItemProps = isExternal
                  ? {
                      href,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      onClick,
                    }
                  : { href, onClick };

                return (
                  <DropdownMenuItem key={visibleCount + index} asChild>
                    <MenuItemContent {...menuItemProps}>
                      {icon && <span className="shrink-0">{icon}</span>}
                      <span>{text}</span>
                    </MenuItemContent>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </>
  );
}
