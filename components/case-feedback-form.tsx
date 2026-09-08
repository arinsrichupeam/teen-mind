'use client';

import React, { useState } from 'react';

interface CaseFeedbackFormProps {
  caseId: string;
  onSuccess?: () => void;
}

export function CaseFeedbackForm({ caseId, onSuccess }: CaseFeedbackFormProps) {
  const [overallRating, setOverallRating] = useState<number>(5);
  const [serviceRating, setServiceRating] = useState<number>(5);
  const [systemRating, setSystemRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/case/${caseId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallRating,
          serviceRating,
          systemRating,
          comment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'เกิดข้อผิดพลาดในการบันทึกแบบประเมิน');
      }

      setIsSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = (
    label: string,
    ratingValue: number,
    setRatingValue: (val: number) => void
  ) => (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: "8px" }} role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRatingValue(star)}
            aria-label={`${label} ${star}`}
            style={{
              fontSize: "24px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: star <= ratingValue ? '#F59E0B' : '#D1D5DB',
              transition: 'color 0.2s',
            }}
          >
            ★
          </button>
        ))}
        <span style={{ marginLeft: '8px', fontSize: '14px', alignSelf: 'center' }}>
          {ratingValue} / 5
        </span>
      </div>
    </div>
  );

  if (isSuccess) {
    return (
      <div
        style={{
          padding: '24px',
          backgroundColor: '#ECFDF5',
          borderRadius: '12px',
          border: '1px solid #10B981',
          textAlign: 'center',
        }}
      >
        <h3 style={{ color: '#047857', marginTop: 0 }}>ขอบคุณสำหรับการประเมินความพึงพอใจ!</h3>
        <p style={{ color: '#065F46' }}>
          ข้อคิดเห็นของคุณมีคุณค่าอย่างยิ่งในการนำไปปรับปรุงการให้บริการ
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        maxWidth: '500px',
        margin: '0 auto',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#1F2937' }}>
        แบบประเมินความพึงพอใจการให้บริการ
      </h3>

      {errorMsg && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#FEF2F2',
            color: '#991B1B',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {renderStarRating('1. ความพึงพอใจในภาพรวม', overallRating, setOverallRating)}
      {renderStarRating('2. การให้บริการของนักจิต / ผู้ปรึกษา', serviceRating, setServiceRating)}
      {renderStarRating('3. ความสะดวกของการใช้งานระบบ / แอปพลิเคชัน', systemRating, setSystemRating)}

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="case-feedback-comment"
          style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}
        >
          ข้อเสนอแนะเพิ่มเติม
        </label>
        <textarea
          id="case-feedback-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="พิมพ์ข้อเสนอแนะหรือความคิดเห็นเพิ่มเติม..."
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #D1D5DB",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isSubmitting ? '#9CA3AF' : '#2563EB',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '16px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
        }}
      >
        {isSubmitting ? 'กำลังส่งแบบประเมิน...' : 'ส่งแบบประเมิน'}
      </button>
    </form>
  );
}
