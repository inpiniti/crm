/** 도메인 규칙 위반. 메시지는 사용자에게 그대로 보여준다 (해요체). */
export class DomainError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export class NotFoundError extends DomainError {
  constructor(what: string) {
    super("not_found", `${what}을(를) 찾을 수 없어요.`);
  }
}
