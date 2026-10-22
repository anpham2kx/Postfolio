import { afterEach, describe, expect, it, vi } from "vitest";
import {
  emailConfig,
  sendContact,
  validateContact,
} from "../../src/lib/contact";

const valid = {
  from_name: "  Test User  ",
  from_email: " test@example.com ",
  message: " This is a test message. ",
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
function configure() {
  vi.stubEnv("NEXT_PUBLIC_EMAILJS_SERVICE_ID", "service_hzhh52o");
  vi.stubEnv("NEXT_PUBLIC_EMAILJS_TEMPLATE_ID", "template_j5k4p8q");
  vi.stubEnv("NEXT_PUBLIC_EMAILJS_PUBLIC_KEY", "QCLgOuRqCwyGGQ2hW");
}
describe("contact validation and EmailJS contract", () => {
  it.each([1, 5000])(
    "accepts a message with exactly %s characters",
    (length) => {
      expect(
        validateContact({ ...valid, message: "a".repeat(length) }),
      ).toEqual({});
    },
  );
  it("requires all fields and rejects whitespace", () =>
    expect(
      Object.keys(
        validateContact({
          from_name: "  ",
          from_email: "wrong@",
          message: "  ",
        }),
      ),
    ).toHaveLength(3));
  it("rejects oversized input", () =>
    expect(
      Object.keys(
        validateContact({
          from_name: "a".repeat(101),
          from_email: `${"a".repeat(250)}@x.com`,
          message: "a".repeat(5001),
        }),
      ),
    ).toHaveLength(3));
  it("accepts and trims valid input", () =>
    expect(validateContact(valid)).toEqual({}));
  it("reports incomplete configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_EMAILJS_SERVICE_ID", "");
    expect(emailConfig()).toBeNull();
  });
  it("sends exactly three template variables with the requested configuration", async () => {
    configure();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await sendContact(valid);
    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(
      fetchMock.mock.calls[0]?.[1].body as string,
    ) as Record<string, unknown>;
    expect(body).toEqual({
      service_id: "service_hzhh52o",
      template_id: "template_j5k4p8q",
      user_id: "QCLgOuRqCwyGGQ2hW",
      template_params: {
        from_name: "Test User",
        from_email: "test@example.com",
        message: "This is a test message.",
      },
    });
  });
  it("does not call the network for invalid data", async () => {
    configure();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(sendContact({ ...valid, message: "" })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([400, 429, 500])("reports failed HTTP %s", async (status) => {
    configure();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status }));
    await expect(sendContact(valid)).rejects.toThrow();
  });
  it("handles network failure", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Network")));
    await expect(sendContact(valid)).rejects.toThrow("Không thể kết nối");
  });
  it("times out with an ambiguous-delivery message", async () => {
    configure();
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) =>
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("timeout", "AbortError")),
            ),
          ),
      ),
    );
    const assertion = expect(sendContact(valid)).rejects.toThrow(
      "Chưa nhận được xác nhận",
    );
    await vi.advanceTimersByTimeAsync(20000);
    await assertion;
  });
});
