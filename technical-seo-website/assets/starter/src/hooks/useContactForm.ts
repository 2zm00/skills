"use client";

import { ChangeEvent, FormEvent, useCallback, useState } from "react";
import { RequestContact } from "@/utils/requestToSrv";

// 문의 폼 상태 + 접수(/api/contact). ContactClientContainer에서 불러 컨텍스트로 넘긴다.

export interface ContactFormValues {
  company: string;
  name: string;
  phone: string;
  message: string;
  interests: string[];
  website: string;
}

export type ContactStatus = "idle" | "sending" | "done" | "failed";

const initialValues: ContactFormValues = { company: "", name: "", phone: "", message: "", interests: [], website: "" };

export function useContactForm({ requiredMessage }: { requiredMessage: string }) {
  const [values, setValues] = useState<ContactFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ContactStatus>("idle");

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.target.name as Exclude<keyof ContactFormValues, "interests">;
    setValues((prev) => ({ ...prev, [field]: event.target.value }));
    setError(null);
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setValues((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest) ? prev.interests.filter((item) => item !== interest) : [...prev.interests, interest],
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "sending") return;
      if (!values.company.trim() || !values.phone.trim()) {
        setError(requiredMessage);
        return;
      }
      setStatus("sending");
      const ok = await RequestContact({ ...values, page: window.location.pathname });
      if (ok) {
        setStatus("done");
        setValues(initialValues);
      } else {
        setStatus("failed");
      }
    },
    [requiredMessage, status, values],
  );

  return { values, error, status, handleChange, toggleInterest, handleSubmit };
}
