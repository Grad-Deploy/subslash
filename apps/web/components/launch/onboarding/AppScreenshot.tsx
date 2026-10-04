import { cn } from "@lib/utils";

/**
 * 앱 화면 캡처(1080×1920) 한 장. 앱 빌드는 정적 내보내기라 next/image의 최적화를 쓸 수 없다
 * (웹 소개의 Landing과 같다).
 */
export function AppScreenshot({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={1080}
      height={1920}
      draggable={false}
      className={cn("block aspect-[1080/1920] w-full object-cover", className)}
    />
  );
}
