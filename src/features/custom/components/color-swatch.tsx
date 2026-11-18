const HEX = /^#[0-9A-Fa-f]{6}$/;

/** 판매자가 고른 글자색 견본과 값. 형식이 어긋난 값은 견본 없이 글자만 보인다 */
export function ColorSwatch({ color }: { color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
      <span
        aria-hidden
        data-slot="color-swatch"
        className="size-3.5 shrink-0 rounded-sm border"
        style={HEX.test(color) ? { backgroundColor: color } : undefined}
      />
      {color}
    </span>
  );
}
