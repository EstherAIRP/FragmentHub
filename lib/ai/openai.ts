import "server-only";

export class OpenAIStructuredOutputError extends Error {
  readonly status?: number;
  readonly details?: string;

  constructor(message: string, options: { status?: number; details?: string } = {}) {
    super(message);
    this.name = "OpenAIStructuredOutputError";
    this.status = options.status;
    this.details = options.details;
  }
}

type StructuredOutputOptions = {
  name: string;
  schema: Record<string, unknown>;
  developer: string;
  user: string;
  model?: string;
  reasoningEffort?: "none" | "low" | "medium" | "high";
};

type ResponsesPayload = {
  status?: string;
  incomplete_details?: {
    reason?: string;
  } | null;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
};

function extractStructuredText(payload: ResponsesPayload): string {
  if (payload.status === "incomplete") {
    throw new OpenAIStructuredOutputError(
      `OpenAI response was incomplete: ${payload.incomplete_details?.reason ?? "unknown reason"}.`,
    );
  }

  for (const item of payload.output ?? []) {
    if (item.type !== "message") continue;

    for (const content of item.content ?? []) {
      if (content.type === "refusal" && content.refusal) {
        throw new OpenAIStructuredOutputError(
          `OpenAI refused the request: ${content.refusal}`,
        );
      }

      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  throw new OpenAIStructuredOutputError(
    "OpenAI returned no structured output text.",
  );
}

export async function callStructuredOutput<T>(
  options: StructuredOutputOptions,
): Promise<{ data: T; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new OpenAIStructuredOutputError(
      "OPENAI_API_KEY is not configured.",
    );
  }

  const model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6-terra";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      reasoning: {
        effort: options.reasoningEffort ?? "low",
      },
      input: [
        {
          role: "developer",
          content: options.developer,
        },
        {
          role: "user",
          content: options.user,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: options.name,
          strict: true,
          schema: options.schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new OpenAIStructuredOutputError(
      "OpenAI API request failed.",
      {
        status: response.status,
        details,
      },
    );
  }

  const payload = (await response.json()) as ResponsesPayload;
  const text = extractStructuredText(payload);

  try {
    return {
      data: JSON.parse(text) as T,
      model,
    };
  } catch {
    throw new OpenAIStructuredOutputError(
      "OpenAI structured output was not valid JSON.",
      { details: text },
    );
  }
}
