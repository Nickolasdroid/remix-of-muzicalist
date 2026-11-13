// Vitest stand-in for the Deno-only `npm:nodemailer` import used by the edge functions.
export default {
  createTransport: () => ({
    sendMail: async () => ({ messageId: "stub-message-id" }),
  }),
};
