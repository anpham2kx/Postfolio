export interface ContactValues {
  from_name: string;
  from_email: string;
  message: string;
}
export type ContactErrors = Partial<Record<keyof ContactValues, string>>;
export const emptyContact: ContactValues = {
  from_name: "",
  from_email: "",
  message: "",
};

export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  const name = values.from_name.trim();
  const email = values.from_email.trim();
  const message = values.message.trim();
  if (name.length < 2 || name.length > 100)
    errors.from_name = "Họ tên cần từ 2 đến 100 ký tự.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.from_email = "Vui lòng nhập địa chỉ email hợp lệ.";
  if (message.length < 1 || message.length > 5000)
    errors.message = "Nội dung cần từ 1 đến 5.000 ký tự.";
  return errors;
}

export function emailConfig() {
  const service = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const template = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
  return service && template && publicKey
    ? { service, template, publicKey }
    : null;
}

export async function sendContact(values: ContactValues): Promise<void> {
  const config = emailConfig();
  if (!config)
    throw new Error(
      "Form chưa được cấu hình. Bạn có thể liên hệ qua các liên kết ở trang Giới thiệu.",
    );
  if (Object.keys(validateContact(values)).length)
    throw new Error("Vui lòng kiểm tra lại thông tin đã nhập.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          service_id: config.service,
          template_id: config.template,
          user_id: config.publicKey,
          template_params: {
            from_name: values.from_name.trim(),
            from_email: values.from_email.trim(),
            message: values.message.trim(),
          },
        }),
      },
    );
    if (!response.ok)
      throw new Error(
        response.status === 429
          ? "Bạn gửi hơi nhanh. Vui lòng đợi một lát rồi thử lại."
          : "Chưa gửi được tin nhắn. Vui lòng thử lại hoặc liên hệ qua các liên kết ở trang Giới thiệu.",
      );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw new Error(
        "Chưa nhận được xác nhận gửi sau 20 giây. Nội dung vẫn được giữ lại; hãy kiểm tra trước khi gửi lại.",
      );
    if (error instanceof TypeError)
      throw new Error("Không thể kết nối. Vui lòng kiểm tra mạng rồi thử lại.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
