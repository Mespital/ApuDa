const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
function response(code, obj) { return { statusCode: code, headers: JSON_HEADERS, body: JSON.stringify(obj) }; }
exports.handler = async function (event) {
  if (event.httpMethod !== "GET") return response(405, { error: "Method not allowed" });
  const configured = (process.env.APUDA_HOSPITAL_API_URL || "").trim();
  if (!configured) return response(503, { code: "BACKEND_NOT_CONFIGURED", results: [], message: "의료진 API 연동 준비 중" });
  let base;
  try { base = new URL(configured); if (base.protocol !== "https:" || base.username || base.password) throw Error("HTTPS URL required"); }
  catch (_) { return response(503, { code: "BACKEND_INVALID_CONFIGURATION", results: [] }); }
  const params = event.queryStringParameters || {};
  const cancer = String(params.cancer || "");
  if (!/^[A-Z_]{2,24}$/.test(cancer)) return response(400, { code: "INVALID_CANCER" });
  const allowedRoles = ["diagnosis","surgery","medical_oncology","radiation","endoscopy","transplant","car_t"];
  const role = allowedRoles.includes(params.role) ? params.role : "";
  const region = String(params.region || "").slice(0, 24);
  if (region && !/^[가-힣a-zA-Z ]+$/.test(region)) return response(400, { code: "INVALID_REGION" });
  const target = new URL("/v1/specialists", base.origin);
  target.searchParams.set("cancer", cancer);
  target.searchParams.set("limit", "50");
  if (role) target.searchParams.set("role", role);
  if (region) target.searchParams.set("region", region);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const upstream = await fetch(target, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!upstream.ok) return response(502, { code: "UPSTREAM_ERROR", results: [] });
    const body = await upstream.json();
    const results = (Array.isArray(body.results) ? body.results : [])
      .filter((x) => x && x.status === "ACTIVE" && x.doctor_name && x.hospital_name)
      .slice(0,50).map((x) => ({
        doctor_name: x.doctor_name, hospital_name: x.hospital_name, region: x.region || "",
        department: x.department || "", specialty_text: x.specialty_text || "",
        profile_url: x.profile_url || "", status: "ACTIVE"
      }));
    return response(200, { cancer, count: results.length, results, notice: "공개 승인 의료진만 표시하며 순위 정보가 아닙니다." });
  } catch (_) { return response(502, { code: "UPSTREAM_UNAVAILABLE", results: [] }); }
  finally { clearTimeout(timer); }
};