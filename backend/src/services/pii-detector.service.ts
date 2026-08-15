export class PIIDetectorService {
  private static EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private static PHONE_REGEX = /^(\+?\d{1,4}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/;
  private static CREDIT_CARD_REGEX = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/;
  private static IP_ADDRESS_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  private static GOV_ID_SSN_REGEX = /^\d{3}-\d{2}-\d{4}$|^\d{12}$/;

  public static detectColumnPII(columnName: string, sampleValues: unknown[]): string | null {
    const colNameLower = columnName.toLowerCase();

    // Check column header names
    if (colNameLower.includes('email')) return 'EMAIL';
    if (colNameLower.includes('phone') || colNameLower.includes('mobile') || colNameLower.includes('contact_no')) return 'PHONE';
    if (colNameLower.includes('ssn') || colNameLower.includes('tax_id') || colNameLower.includes('gov_id') || colNameLower.includes('aadhaar')) return 'GOV_ID';
    if (colNameLower.includes('card') || colNameLower.includes('credit_card') || colNameLower.includes('account_number')) return 'CREDIT_CARD';
    if (colNameLower.includes('ip_address') || colNameLower.includes('ip')) return 'IP_ADDRESS';
    if (colNameLower === 'name' || colNameLower === 'full_name' || colNameLower.includes('customer_name') || colNameLower.includes('client_name')) return 'NAME';

    // Sample data check
    const validSamples = sampleValues.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
    if (validSamples.length === 0) return null;

    let emailCount = 0;
    let phoneCount = 0;
    let cardCount = 0;
    let ipCount = 0;
    let ssnCount = 0;

    for (const val of validSamples) {
      const strVal = String(val).trim();
      if (this.EMAIL_REGEX.test(strVal)) emailCount++;
      if (this.PHONE_REGEX.test(strVal) && strVal.length >= 7) phoneCount++;
      if (this.CREDIT_CARD_REGEX.test(strVal.replace(/[- ]/g, ''))) cardCount++;
      if (this.IP_ADDRESS_REGEX.test(strVal)) ipCount++;
      if (this.GOV_ID_SSN_REGEX.test(strVal)) ssnCount++;
    }

    const threshold = Math.max(1, Math.floor(validSamples.length * 0.25));

    if (emailCount >= threshold) return 'EMAIL';
    if (phoneCount >= threshold) return 'PHONE';
    if (cardCount >= threshold) return 'CREDIT_CARD';
    if (ipCount >= threshold) return 'IP_ADDRESS';
    if (ssnCount >= threshold) return 'GOV_ID';

    return null;
  }

  public static maskValue(value: unknown, piiType: string): string {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    if (!str) return '';

    switch (piiType) {
      case 'EMAIL': {
        const parts = str.split('@');
        if (parts.length === 2) {
          const name = parts[0];
          const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : '***';
          return `${maskedName}@${parts[1]}`;
        }
        return '***@masked.com';
      }
      case 'PHONE': {
        const digits = str.replace(/\D/g, '');
        if (digits.length >= 4) {
          return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
        }
        return '***-***-****';
      }
      case 'CREDIT_CARD': {
        const clean = str.replace(/\D/g, '');
        if (clean.length >= 4) {
          return `****-****-****-${clean.slice(-4)}`;
        }
        return '****-****-****-****';
      }
      case 'NAME': {
        const parts = str.split(/\s+/);
        return parts.map((p) => (p.length > 1 ? `${p[0]}***` : '*')).join(' ');
      }
      case 'GOV_ID': {
        return 'XXX-XX-XXXX';
      }
      case 'IP_ADDRESS': {
        return 'xxx.xxx.xxx.xxx';
      }
      default:
        return '***MASKED***';
    }
  }

  public static sanitizeDatasetForAI(
    rows: Record<string, unknown>[],
    profiles: Array<{ columnName: string; detectedPII?: string | null }>
  ): Record<string, unknown>[] {
    const piiColumnsMap = new Map<string, string>();
    for (const prof of profiles) {
      if (prof.detectedPII) {
        piiColumnsMap.set(prof.columnName, prof.detectedPII);
      }
    }

    if (piiColumnsMap.size === 0) return rows;

    return rows.map((row) => {
      const sanitized: Record<string, unknown> = { ...row };
      for (const [col, piiType] of piiColumnsMap.entries()) {
        if (sanitized[col] !== undefined) {
          sanitized[col] = this.maskValue(sanitized[col], piiType);
        }
      }
      return sanitized;
    });
  }
}
