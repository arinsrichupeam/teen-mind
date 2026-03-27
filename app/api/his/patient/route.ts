import { requireAdmin } from "@/lib/get-session";

type AbsTokenResponse = {
  MessageCode?: number;
  Result?: string;
};

type AbsPatientItem = {
  HN?: string | null;
};

type AbsPatientResponse = {
  MessageCode?: number;
  Result?: AbsPatientItem[];
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

async function fetchAbsPatient(
  absBaseUrl: string,
  authToken: string,
  citizenId: string
) {
  const patientEndpoint = `${absBaseUrl}/api/His/Patient`;

  // บางระบบรับ GET พร้อม query string
  const getByQueryResponse = await fetch(
    `${patientEndpoint}?cardno=${encodeURIComponent(citizenId)}`,
    {
      method: "GET",
      headers: {
        "X-Access-Token": authToken,
      },
      cache: "no-store",
    }
  );

  if (getByQueryResponse.ok) {
    return getByQueryResponse;
  }

  // fallback เป็น POST body JSON ตามที่ระบบปลายทางบางแห่งรองรับ
  return fetch(patientEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": authToken,
    },
    body: JSON.stringify({ cardno: citizenId }),
    cache: "no-store",
  });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { cardno } = (await req.json()) as { cardno?: string };
    const citizenId = String(cardno ?? "").trim();

    if (!/^\d{13}$/.test(citizenId)) {
      return Response.json(
        { error: "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.ABS_BASE_URL?.trim();
    const username = process.env.ABS_USERNAME?.trim();
    const password = process.env.ABS_PASSWORD?.trim();

    if (!baseUrl || !username || !password) {
      return Response.json(
        { error: "ABS environment variables are not configured" },
        { status: 500 }
      );
    }

    const absBaseUrl = normalizeBaseUrl(baseUrl);
    const tokenUrl = `${absBaseUrl}/api/GetToken?user=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      cache: "no-store",
    });

    if (!tokenResponse.ok) {
      throw new Error("ไม่สามารถรับ token จาก ABS ได้");
    }

    const tokenPayload = (await tokenResponse.json()) as AbsTokenResponse;
    const authToken = tokenPayload.Result?.trim();

    if (tokenPayload.MessageCode !== 200 || !authToken) {
      throw new Error("ABS token response ไม่ถูกต้อง");
    }

    const patientResponse = await fetchAbsPatient(
      absBaseUrl,
      authToken,
      citizenId
    );

    if (!patientResponse.ok) {
      throw new Error("ไม่สามารถค้นหาข้อมูลผู้ป่วยจาก ABS ได้");
    }

    const patientPayload = (await patientResponse.json()) as AbsPatientResponse;
    const hn = patientPayload.Result?.[0]?.HN?.trim();

    if (patientPayload.MessageCode !== 200 || !hn) {
      return Response.json({ hn: null });
    }

    return Response.json({ hn });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการค้นหา HN",
      },
      { status: 500 }
    );
  }
}
