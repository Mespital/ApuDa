export type LabDictionaryEntry = {
  canonicalCode: string;
  displayName: string;
  aliases: string[];
};

const entries: LabDictionaryEntry[] = [
  { canonicalCode: "LAB_WBC", displayName: "WBC", aliases: ["WBC", "백혈구"] },
  { canonicalCode: "LAB_RBC", displayName: "RBC", aliases: ["RBC", "적혈구"] },
  { canonicalCode: "LAB_HEMOGLOBIN", displayName: "Hb", aliases: ["HB", "HGB", "HEMOGLOBIN", "헤모글로빈", "혈색소"] },
  { canonicalCode: "LAB_HEMATOCRIT", displayName: "Hct", aliases: ["HCT", "HEMATOCRIT", "적혈구용적률"] },
  { canonicalCode: "LAB_PLATELET", displayName: "Platelet", aliases: ["PLT", "PLATELET", "PLATELETS", "혈소판"] },
  { canonicalCode: "LAB_ANC", displayName: "ANC", aliases: ["ANC", "절대호중구수"] },
  { canonicalCode: "LAB_AST", displayName: "AST", aliases: ["AST", "GOT", "SGOT"] },
  { canonicalCode: "LAB_ALT", displayName: "ALT", aliases: ["ALT", "GPT", "SGPT"] },
  { canonicalCode: "LAB_ALP", displayName: "ALP", aliases: ["ALP", "ALKALINE PHOSPHATASE", "알칼리인산분해효소"] },
  { canonicalCode: "LAB_GGT", displayName: "GGT", aliases: ["GGT", "GAMMA GT", "감마지티피", "감마GPT"] },
  { canonicalCode: "LAB_TOTAL_BILIRUBIN", displayName: "Total bilirubin", aliases: ["TBIL", "TOTAL BILIRUBIN", "총빌리루빈"] },
  { canonicalCode: "LAB_ALBUMIN", displayName: "Albumin", aliases: ["ALBUMIN", "ALB", "알부민"] },
  { canonicalCode: "LAB_CREATININE", displayName: "Creatinine", aliases: ["CREATININE", "CREA", "CR", "크레아티닌"] },
  { canonicalCode: "LAB_EGFR", displayName: "eGFR", aliases: ["EGFR", "ESTIMATED GFR", "사구체여과율"] },
  { canonicalCode: "LAB_BUN", displayName: "BUN", aliases: ["BUN", "BLOOD UREA NITROGEN", "혈중요소질소"] },
  { canonicalCode: "LAB_GLUCOSE", displayName: "Glucose", aliases: ["GLUCOSE", "GLU", "혈당", "포도당"] },
  { canonicalCode: "LAB_HBA1C", displayName: "HbA1c", aliases: ["HBA1C", "A1C", "당화혈색소"] },
  { canonicalCode: "LAB_LDL", displayName: "LDL-C", aliases: ["LDL", "LDL-C", "LDLC", "저밀도콜레스테롤"] },
  { canonicalCode: "LAB_HDL", displayName: "HDL-C", aliases: ["HDL", "HDL-C", "HDLC", "고밀도콜레스테롤"] },
  { canonicalCode: "LAB_TRIGLYCERIDE", displayName: "Triglyceride", aliases: ["TG", "TRIGLYCERIDE", "TRIGLYCERIDES", "중성지방"] },
  { canonicalCode: "LAB_CRP", displayName: "CRP", aliases: ["CRP", "C-REACTIVE PROTEIN", "C반응단백"] },
  { canonicalCode: "LAB_CEA", displayName: "CEA", aliases: ["CEA", "암태아성항원"] },
  { canonicalCode: "LAB_CA19_9", displayName: "CA19-9", aliases: ["CA19-9", "CA199", "CA19.9"] },
  { canonicalCode: "LAB_AFP", displayName: "AFP", aliases: ["AFP", "알파태아단백"] },
  { canonicalCode: "LAB_PSA", displayName: "PSA", aliases: ["PSA", "전립선특이항원"] },
  { canonicalCode: "LAB_CA125", displayName: "CA-125", aliases: ["CA125", "CA-125"] },
  { canonicalCode: "LAB_CA15_3", displayName: "CA15-3", aliases: ["CA15-3", "CA153", "CA15.3"] }
];

function key(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9가-힣]+/g, "");
}

const aliasMap = new Map<string, LabDictionaryEntry>();
for (const entry of entries) {
  for (const alias of entry.aliases) {
    aliasMap.set(key(alias), entry);
  }
}

export function normalizeLabName(rawName: string) {
  const match = aliasMap.get(key(rawName));
  return match
    ? { canonicalCode: match.canonicalCode, displayName: match.displayName }
    : { canonicalCode: null, displayName: rawName.trim() };
}

export const commonLabNames = entries.map((entry) => entry.displayName);
