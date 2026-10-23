import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { NextRequest } from "next/server";

const loggedWarnings: unknown[][] = [];
const storedSubmissions: Array<{ name: string; email: string; message: string; deliveryStatus: string }> = [];
const sentEmails: Array<{
  to: string;
  subject: string;
  html: string;
  options: { replyTo?: string };
}> = [];
let sendFailure: Error | null = null;

mock.module("@/lib/database/db", {
  namedExports: {
    connectToDatabase: async () => {},
    ContactSubmission: {
      create: async (submission: { name: string; email: string; message: string; deliveryStatus: string }) => {
        const stored = { ...submission, _id: String(storedSubmissions.length + 1) };
        storedSubmissions.push(stored);
        return stored;
      },
      updateOne: async ({ _id }: { _id: string }, { $set }: { $set: { deliveryStatus: string } }) => {
        const submission = storedSubmissions.find((item, index) => String(index + 1) === _id);
        if (submission) submission.deliveryStatus = $set.deliveryStatus;
      },
    },
    Settings: {
      findOne: () => ({
        lean: async () => ({ supportEmail: "admin@example.test" }),
      }),
    },
  },
});

mock.module("@/lib/integrations/email", {
  namedExports: {
    resolveTransport: () => "smtp",
    sendEmail: async (
      to: string,
      subject: string,
      html: string,
      options: { replyTo?: string } = {}
    ) => {
      sentEmails.push({ to, subject, html, options });
      if (sendFailure) throw sendFailure;
    },
  },
});

mock.module("@/lib/security/rate-limit", {
  namedExports: {
    checkRateLimit: async () => ({
      allowed: true,
      retryAfterSeconds: 0,
      limit: 5,
      remaining: 4,
    }),
    rateLimitHeaders: () => ({}),
  },
});

function makeRequest(body: string): NextRequest {
  return new NextRequest("http://localhost/api/v1/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

function validBody() {
  return JSON.stringify({
    name: "Test User",
    email: "visitor@example.test",
    message: "Please contact me about the product.",
  });
}

test("contact endpoint returns safe validation and delivery responses without sending real email", async (context) => {
  const { POST } = await import("./route");
  const originalWarn = console.warn;
  const originalError = console.error;
  const loggedErrors: unknown[][] = [];
  console.warn = (...args: unknown[]) => loggedWarnings.push(args);
  console.error = (...args: unknown[]) => loggedErrors.push(args);

  try {
    await context.test("invalid form data returns generic 400 and logs metadata only", async () => {
      const response = await POST(makeRequest(JSON.stringify({
        name: { submittedValue: "PRIVATE-NAME-123" },
        email: "PRIVATE-EMAIL-123",
        message: { submittedValue: "PRIVATE-MESSAGE-123" },
      })));
      const responseText = await response.text();
      const responseBody = JSON.parse(responseText);

      assert.equal(response.status, 400);
      assert.equal(responseBody.payload.error.code, "validation_error");
      assert.match(responseBody.payload.error.message, /name|input|string/i);
      assert.equal(responseBody.payload.error.field, "name");
      assert.doesNotMatch(responseText, /stack|trace|PRIVATE-|Error:| at .+\(/i);
      assert.equal(loggedWarnings.length, 0);
      assert.equal(sentEmails.length, 0);
    });

    await context.test("malformed JSON returns a safe 400 response", async () => {
      const response = await POST(makeRequest('{"name":'));
      const responseText = await response.text();
      const responseBody = JSON.parse(responseText);

      assert.equal(response.status, 400);
      assert.equal(responseBody.payload.error.code, "invalid_json");
      assert.equal(responseBody.payload.error.message, "Invalid JSON body");
      assert.doesNotMatch(responseText, /stack|trace|Error:| at .+\(/i);
    });

    await context.test("email failure keeps the inquiry and returns success without exception details", async () => {
      sendFailure = new Error("PRIVATE-EXCEPTION-MESSAGE at C:\\private\\path.ts");
      sendFailure.stack = "Error: PRIVATE-EXCEPTION-MESSAGE\n    at C:\\private\\path.ts:10:2";

      const response = await POST(makeRequest(validBody()));
      const responseText = await response.text();
      const responseBody = JSON.parse(responseText);

      assert.equal(response.status, 201);
      assert.equal(responseBody.success, true);
      assert.equal(responseBody.payload.message, "Message received. Our team will get back to you shortly.");
      assert.equal(storedSubmissions[0].deliveryStatus, "failed");
      assert.doesNotMatch(responseText, /PRIVATE-|stack|trace|path\.ts|Error:/i);
      assert.equal(loggedErrors.length, 1);
      assert.doesNotMatch(JSON.stringify(loggedErrors), /PRIVATE-EXCEPTION-MESSAGE/);
      assert.doesNotMatch(JSON.stringify(loggedErrors), /PRIVATE-NAME-123|PRIVATE-EMAIL-123|PRIVATE-MESSAGE-123/);
    });

    await context.test("valid submission returns 201 and calls only the mocked email sender", async () => {
      sendFailure = null;
      sentEmails.length = 0;
      const response = await POST(makeRequest(validBody()));
      const responseBody = await response.json();

      assert.equal(response.status, 201);
      assert.equal(responseBody.success, true);
      assert.equal(responseBody.payload.message, "Message received. Our team will get back to you shortly.");
      assert.equal(storedSubmissions.at(-1)?.deliveryStatus, "sent");
      assert.equal(sentEmails.length, 1);
      assert.equal(sentEmails[0].to, "admin@example.test");
      assert.equal(sentEmails[0].options.replyTo, "visitor@example.test");
      assert.match(sentEmails[0].subject, /\[CrushSVG Contact\] Test User/);
      assert.match(sentEmails[0].html, /Please contact me about the product\./);
    });
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
  }
});
