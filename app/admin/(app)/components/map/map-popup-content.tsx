import {
  getAssessmentResultColor,
  getAssessmentResultLabel,
} from "@/lib/assessment-result-colors";
import { prefix } from "@/utils/data";
import { formatThaiDateTime } from "@/utils/helper";
import { MapLocation } from "@/types";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getProfileName(location: MapLocation) {
  const prefixLabel =
    prefix.find((item) => item.key === String(location.profile.prefixId))
      ?.label ?? "";

  return `${prefixLabel} ${location.profile.firstname} ${location.profile.lastname}`.trim();
}

export function buildPopupHtml(location: MapLocation) {
  const resultLabel =
    location.result_text || getAssessmentResultLabel(location.result);
  const resultColor = getAssessmentResultColor(location.result);
  const schoolLine = location.profile.schoolName
    ? `<p style="margin:0 0 6px;color:#52525b;font-size:13px;">โรงเรียน: ${escapeHtml(location.profile.schoolName)}</p>`
    : "";

  return `
    <div style="min-width:220px;font-size:13px;line-height:1.4;">
      <p style="margin:0 0 6px;font-weight:600;">${escapeHtml(getProfileName(location))}</p>
      ${schoolLine}
      <p style="margin:0 0 6px;color:#52525b;">วันที่ประเมิน: ${escapeHtml(formatThaiDateTime(location.createdAt))}</p>
      <p style="margin:0 0 6px;">
        ผลประเมิน:
        <span style="font-weight:600;color:${resultColor};">${escapeHtml(resultLabel)}</span>
      </p>
      <p style="margin:0 0 8px;color:#71717a;">
        ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
      </p>
      <a
        href="https://www.google.co.th/maps/place/${location.latitude},${location.longitude}"
        target="_blank"
        rel="noopener noreferrer"
        style="color:#006fee;font-size:13px;"
      >
        ดูบน Google Maps
      </a>
    </div>
  `;
}
