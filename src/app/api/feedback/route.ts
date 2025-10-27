import { NextResponse } from "next/server";
import { DatabaseError } from "pg";

import { query } from "@/lib/db";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionary";
import { resolveLocale } from "@/lib/i18n/utils";
import { createFeedbackSchema, type FeedbackInput } from "@/lib/validation/feedback";

type FeedbackEntry = {
  id: number;
  feedback_type: string;
  content: string;
  email: string;
  created_at: string;
  updated_at: string;
};

type FeedbackFieldErrors = Partial<Record<keyof FeedbackInput, string>>;

type FeedbackFormDictionary = Dictionary["feedback"]["form"];

type SchemaResult = {
  dictionary: FeedbackFormDictionary;
  schema: ReturnType<typeof createFeedbackSchema>;
};

function mapDatabaseError(
  error: unknown,
  dictionary: FeedbackFormDictionary
): { status: number; message: string; fieldErrors?: FeedbackFieldErrors } {
  if (error instanceof DatabaseError) {
    console.error("Database error:", error);
    return {
      status: 500,
      message: dictionary.messages.serverError,
    };
  }

  return {
    status: 500,
    message: dictionary.messages.serverError,
  };
}

async function resolveSchema(request: Request): Promise<SchemaResult> {
  const locale = resolveLocale({
    headerLocale: request.headers.get("accept-language"),
  });

  const dictionary = (await getDictionary(locale)).feedback.form;
  const schema = createFeedbackSchema(dictionary.validation);

  return { schema, dictionary };
}

export async function POST(request: Request) {
  let schemaResult: SchemaResult | null = null;

  try {
    schemaResult = await resolveSchema(request);
    const { schema, dictionary } = schemaResult;

    const payload = await request.json();
    const parseResult = schema.safeParse(payload);

    if (!parseResult.success) {
      const fieldErrors: FeedbackFieldErrors = {};
      for (const issue of parseResult.error.issues) {
        const key = issue.path[0];
        if (key === "feedbackType" || key === "content" || key === "email") {
          fieldErrors[key] = issue.message;
        }
      }

      return NextResponse.json(
        {
          ok: false,
          error: dictionary.messages.validationError,
          fieldErrors,
        },
        { status: 400 }
      );
    }

    const { feedbackType, content, email } = parseResult.data;

    const result = await query<FeedbackEntry>(
      `insert into public.feedbacks (feedback_type, content, email)
       values ($1, $2, $3)
       returning id, feedback_type, content, email, created_at, updated_at`,
      [feedbackType, content, email]
    );

    return NextResponse.json({
      ok: true,
      feedback: result.rows[0],
    });
  } catch (error) {
    console.error("feedback POST failed", error);
    const dictionary = schemaResult?.dictionary ?? (await resolveSchema(request)).dictionary;
    const { status, message, fieldErrors } = mapDatabaseError(error, dictionary);

    return NextResponse.json(
      {
        ok: false,
        error: message,
        fieldErrors,
      },
      { status }
    );
  }
}
