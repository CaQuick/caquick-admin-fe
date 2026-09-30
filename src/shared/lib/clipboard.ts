/**
 * 글자를 클립보드에 복사한다. 성공 여부를 돌려주고 던지지 않는다.
 * Clipboard API는 보안 컨텍스트(https·localhost)에만 있어 http LAN 접속에서는 선택 복사로 대신한다.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 권한 거부 등은 아래 방식으로 한 번 더 시도한다
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  // 대화 상자는 포커스를 가두므로 그 안에 붙여야 선택이 유지된다
  const host = document.activeElement?.closest('[role="dialog"]') ?? document.body;
  host.appendChild(area);
  area.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}
