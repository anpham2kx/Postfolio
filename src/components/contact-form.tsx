"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  emptyContact,
  sendContact,
  validateContact,
  type ContactErrors,
  type ContactValues,
} from "@/lib/contact";
import { Icon } from "./icon";

export function ContactForm() {
  const [values, setValues] = useState<ContactValues>(emptyContact);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const nextErrors = validateContact(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const first = Object.keys(nextErrors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      setStatus("idle");
      return;
    }
    lock.current = true;
    setStatus("sending");
    setNotice("");
    try {
      await sendContact(values);
      setStatus("success");
      setNotice("Tin nhắn của bạn đã được gửi thành công!");
      setValues(emptyContact);
    } catch (error) {
      setStatus("error");
      setNotice(
        error instanceof Error
          ? error.message
          : "Chưa gửi được tin nhắn. Vui lòng thử lại.",
      );
    } finally {
      lock.current = false;
    }
  }
  function change(field: keyof ContactValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status === "success") {
      setStatus("idle");
      setNotice("");
    }
  }
  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className="contact-form"
      aria-busy={status === "sending"}
    >
      <fieldset disabled={status === "sending"}>
        <legend className="sr-only">Gửi tin nhắn cho Phạm Thanh An</legend>
        <div className="field">
          <label htmlFor="from-name">
            Họ tên <span>*</span>
          </label>
          <input
            id="from-name"
            name="from_name"
            autoComplete="name"
            placeholder="Nhập họ tên của bạn..."
            required
            minLength={2}
            maxLength={100}
            value={values.from_name}
            onChange={(e) => change("from_name", e.target.value)}
            aria-invalid={Boolean(errors.from_name)}
            aria-describedby={errors.from_name ? "name-error" : undefined}
          />
          {errors.from_name && (
            <p id="name-error" className="field-error">
              {errors.from_name}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="from-email">
            Email <span>*</span>
          </label>
          <input
            id="from-email"
            name="from_email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@example.com"
            required
            maxLength={254}
            value={values.from_email}
            onChange={(e) => change("from_email", e.target.value)}
            aria-invalid={Boolean(errors.from_email)}
            aria-describedby={errors.from_email ? "email-error" : undefined}
          />
          {errors.from_email && (
            <p id="email-error" className="field-error">
              {errors.from_email}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="message">
            Nội dung <span>*</span>
          </label>
          <textarea
            id="message"
            name="message"
            placeholder="Viết nội dung..."
            required
            minLength={1}
            maxLength={5000}
            rows={4}
            value={values.message}
            onChange={(e) => change("message", e.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "message-error" : "message-help"}
          />
          <div className="field-meta">
            <span id="message-help">Từ 1 đến 5.000 ký tự</span>
            <span>{values.message.length}/5000</span>
          </div>
          {errors.message && (
            <p id="message-error" className="field-error">
              {errors.message}
            </p>
          )}
        </div>
        <button
          className="primary-button w-full justify-center"
          type="submit"
          disabled={status === "sending"}
        >
          {status === "sending" ? (
            <>
              <span className="spinner" />
              Đang gửi...
            </>
          ) : (
            <>
              Gửi tin nhắn
              <Icon name="send" size={17} />
            </>
          )}
        </button>
      </fieldset>
      <div
        aria-live="polite"
        aria-atomic="true"
        className={`form-notice ${status === "error" ? "is-error" : ""}`}
      >
        {notice && (
          <p>
            {status === "success" && <Icon name="check" size={17} />}
            {notice}
          </p>
        )}
      </div>
    </form>
  );
}
