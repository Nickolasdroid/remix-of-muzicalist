import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase client BEFORE importing the pipeline module.
const templateRow = {
  id: "tpl-1",
  name: "Welcome",
  category: "onboarding",
  type: "transactional",
  active_version_id: "ver-1",
};
const versionRow = {
  id: "ver-1",
  version_number: 3,
  status: "Published",
  subject: "Hi {{user.first_name}}",
  html_content: "<p>Hi {{user.first_name}}</p>",
  text_content: "Hi {{user.first_name}}",
};

const state: {
  templateData: unknown;
  versionData: unknown;
  templateError: unknown;
  versionError: unknown;
} = {
  templateData: templateRow,
  versionData: versionRow,
  templateError: null,
  versionError: null,
};

vi.mock("@/integrations/supabase/client", () => {
  const from = (table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => {
          if (table === "email_templates")
            return { data: state.templateData, error: state.templateError };
          return { data: state.versionData, error: state.versionError };
        },
      }),
    }),
  });
  return { supabase: { from } };
});

import {
  sendCommunication,
  CommunicationPipelineError,
} from "../communicationPipeline";

beforeEach(() => {
  state.templateData = templateRow;
  state.versionData = versionRow;
  state.templateError = null;
  state.versionError = null;
});

describe("sendCommunication (pipeline)", () => {
  it("renders active version and returns payload metadata", async () => {
    const payload = await sendCommunication({
      templateId: "tpl-1",
      channel: "email",
      variables: { "user.first_name": "Alex", "user.email": "a@b.co" },
      recipient: { email: "a@b.co" },
      context: { source: "test" },
    });
    expect(payload.ok).toBe(true);
    expect(payload.subject).toBe("Hi Alex");
    expect(payload.html).toBe("<p>Hi Alex</p>");
    expect(payload.metadata.template.id).toBe("tpl-1");
    expect(payload.metadata.version.id).toBe("ver-1");
    expect(payload.metadata.context).toEqual({ source: "test" });
    expect(payload.metadata.used_variables).toContain("user.first_name");
  });

  it("throws COMM_TEMPLATE_NOT_FOUND when template is missing", async () => {
    state.templateData = null;
    await expect(
      sendCommunication({ templateId: "missing", channel: "email" }),
    ).rejects.toMatchObject({
      code: "template_not_found",
      errorCode: "COMM_TEMPLATE_NOT_FOUND",
    });
  });

  it("throws COMM_ACTIVE_VERSION_NOT_FOUND when there is no active version", async () => {
    state.templateData = { ...templateRow, active_version_id: null };
    try {
      await sendCommunication({ templateId: "tpl-1", channel: "email" });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(CommunicationPipelineError);
      expect((e as CommunicationPipelineError).errorCode).toBe(
        "COMM_ACTIVE_VERSION_NOT_FOUND",
      );
    }
  });

  it("throws COMM_VERSION_NOT_FOUND when the version row is absent", async () => {
    state.versionData = null;
    await expect(
      sendCommunication({ templateId: "tpl-1", channel: "email" }),
    ).rejects.toMatchObject({ errorCode: "COMM_VERSION_NOT_FOUND" });
  });

  it("returns validation_errors when required variables are missing", async () => {
    state.versionData = {
      ...versionRow,
      subject: "{{user.email}}",
      html_content: "{{user.email}}",
      text_content: "{{user.email}}",
    };
    const payload = await sendCommunication({
      templateId: "tpl-1",
      channel: "email",
      variables: {},
    });
    expect(payload.ok).toBe(false);
    expect(payload.validation_errors.length).toBeGreaterThan(0);
  });
});
