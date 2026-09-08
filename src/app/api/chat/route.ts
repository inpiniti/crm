import { NextResponse } from "next/server";
import { CRM_TOOL_DECLARATIONS, executeCrmTool } from "@/lib/crmAgentTools";

export const runtime = "nodejs";

const SIMULATION_GEMINI_URL = "https://simulation-inpiniti.vercel.app/api/simple/gemini";
const FN_OPEN = "[[FN_CALL]]";
const FN_CLOSE = "[[/FN_CALL]]";
const MAX_TOOL_ROUNDS = 4;

interface ToolCallPart {
  functionCall: { name: string; args?: Record<string, unknown> };
  thoughtSignature?: string;
  [key: string]: unknown;
}

function splitToolCalls(raw: string): { text: string; calls: ToolCallPart[] } {
  const calls: ToolCallPart[] = [];
  let text = "";
  let rest = raw;

  while (true) {
    const open = rest.indexOf(FN_OPEN);
    if (open < 0) {
      text += rest;
      break;
    }
    text += rest.slice(0, open);
    const close = rest.indexOf(FN_CLOSE, open);
    if (close < 0) break;

    const json = rest.slice(open + FN_OPEN.length, close);
    try {
      const part = JSON.parse(json) as ToolCallPart;
      if (part?.functionCall?.name) calls.push(part);
    } catch {
      // ignore
    }
    rest = rest.slice(close + FN_CLOSE.length);
  }
  return { text: text.trim(), calls };
}

const SYSTEM_PROMPT = `당신은 사용자의 CRM 데이터베이스(Supabase)에 실시간으로 연결된 지능형 'CRM AI 에이전트'입니다.
(이름: CRM AI 에이전트)

[보유한 도구(Function Calling)]
당신은 실제 CRM 데이터베이스와 상호작용할 수 있는 강력한 도구들을 가지고 있습니다:
1. queryCrm: 회사(companies), 프로젝트(projects), 사람(people), 업무(tasks), 작업일지(work) 데이터를 조회하거나 검색합니다.
   - 예: "가장 처음 다녔던 회사는 어디야?" -> queryCrm(table: "companies") 호출 후 입사일(joinedAt) 순서로 정렬하여 답변
   - 예: "SEED-TICK 프로젝트 설명해줘" -> queryCrm(table: "projects", keyword: "SEED-TICK") 호출 후 상세 설명 답변
2. createProject: 사용자가 말로 프로젝트 생성을 요청하면 프로젝트를 DB에 직접 등록합니다.
3. createTask: 사용자가 말로 업무 추가를 요청하면 지정된 프로젝트에 업무를 직접 등록합니다.
4. createWorkLog: 오늘 한 일이나 작업 일지 등록을 요청하면 작업 일지를 직접 기록합니다.

[핵심 행동 지침]
1. 사용자가 회사의 입/퇴사일, 프로젝트 내역, 사람 정보, 업무, 작업 일지 등 실제 데이터를 질문하면 절대 지어내거나 모른다고 하지 말고, 반드시 queryCrm 도구를 호출해 실제 데이터를 확인한 후 답변하세요.
2. 사용자가 "프로젝트 등록해줘", "업무 추가해줘", "작업 일지 써줘"라고 자연어로 요청하면 필요한 정보를 파악하여 createProject / createTask / createWorkLog 도구를 즉시 호출하세요.
3. 친절하고 신뢰감 있는 격식체(~해요, ~합니다)로 깔끔한 마크다운을 활용하여 답변하세요.
4. 절대 자신을 '토스' 브랜드로 칭하지 마세요. 당신은 'CRM AI 에이전트'입니다.
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "메시지가 비어있습니다." }, { status: 400 });
    }

    // Gemini contents 변환
    const contents: Array<{ role: string; parts: unknown[] }> = messages.map(
      (m: { role: string; content?: string; parts?: Array<{ text?: string }> }) => {
        let text = "";
        if (typeof m.content === "string") text = m.content;
        else if (Array.isArray(m.parts)) text = m.parts.map((p) => p.text || "").join("\n");
        return {
          role: m.role === "assistant" || m.role === "model" ? "model" : "user",
          parts: [{ text: text || "" }],
        };
      }
    );

    // 스트리밍 ReadableStream 생성 (도구 호출 왕복 루프 포함)
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
            const bodyPayload = {
              contents,
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
              tools: [{ functionDeclarations: CRM_TOOL_DECLARATIONS }],
            };

            const upstreamRes = await fetch(SIMULATION_GEMINI_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bodyPayload),
            });

            if (!upstreamRes.ok) {
              const err = await upstreamRes.text().catch(() => "");
              controller.enqueue(encoder.encode(`⚠️ AI 응답 생성 오류 (${upstreamRes.status}): ${err}`));
              controller.close();
              return;
            }

            // 원문 버퍼 읽기
            const raw = await upstreamRes.text();
            const { text, calls } = splitToolCalls(raw);

            // 모델이 도구를 호출한 경우
            if (calls.length > 0 && round < MAX_TOOL_ROUNDS) {
              // 사용자에게 진행 알림
              for (const call of calls) {
                if (call.functionCall.name === "queryCrm") {
                  controller.enqueue(encoder.encode(`🔍 CRM 데이터베이스(${call.functionCall.args?.table ?? ""})를 조회하고 있어요...\n\n`));
                } else if (call.functionCall.name === "createProject") {
                  controller.enqueue(encoder.encode(`📁 새 프로젝트를 등록하는 중입니다...\n\n`));
                } else if (call.functionCall.name === "createTask") {
                  controller.enqueue(encoder.encode(`📝 새 업무를 등록하는 중입니다...\n\n`));
                } else if (call.functionCall.name === "createWorkLog") {
                  controller.enqueue(encoder.encode(`⏱️ 작업 일지를 기록하는 중입니다...\n\n`));
                }
              }

              // 도구 실행
              const results = await Promise.all(
                calls.map(async (call) => ({
                  name: call.functionCall.name,
                  response: await executeCrmTool(call.functionCall.name, call.functionCall.args ?? {}),
                }))
              );

              // Gemini 대화 기록에 도구 호출과 도구 응답을 추가 (멀티턴)
              contents.push({ role: "model", parts: calls });
              contents.push({
                role: "user",
                parts: results.map((r) => ({
                  functionResponse: {
                    name: r.name,
                    response: r.response && typeof r.response === "object" && !Array.isArray(r.response) ? r.response : { value: r.response },
                  },
                })),
              });

              // 다음 턴에서 모델이 도구 실행 결과를 바탕으로 최종 답변을 작성
              continue;
            }

            // 도구 호출이 없거나 마지막 턴인 경우: 최종 텍스트 출력 후 종료
            if (text) {
              controller.enqueue(encoder.encode(text));
            } else if (round === MAX_TOOL_ROUNDS) {
              controller.enqueue(encoder.encode("요청하신 작업을 처리했습니다."));
            }
            break;
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          controller.enqueue(encoder.encode(`\n⚠️ 처리 중 문제가 발생했습니다: ${msg}`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
