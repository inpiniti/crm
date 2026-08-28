/** 서버 컴포넌트에서 데이터 로드를 감싸 실패를 값으로 돌려준다 (JSX 를 try/catch 밖에 두기 위함) */
export async function attempt<T>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    return { ok: false, error };
  }
}
