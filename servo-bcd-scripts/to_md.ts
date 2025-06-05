import * as fs from 'fs';

type BcdEntry = Record<string, Record<string, boolean | null | undefined>>;

interface Section {
  day_percentage: number;
  bcd_entries: BcdEntry[];
}

const json = JSON.parse(fs.readFileSync('popularityBcdMap.json', 'utf-8'));

function getAllExposures(entries: BcdEntry[]): string[] {
  const exposures = new Set<string>();
  for (const entry of entries) {
    for (const key in entry) {
      const value = entry[key];
      if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(ex => exposures.add(ex));
      }
    }
  }
  return Array.from(exposures);
}

function exposureCell(val: boolean | null | undefined): string {
  if (val === true) return '✅';
  if (val === false) return '❌';
  return '';
}

let md = '';

for (const [sectionName, sectionValue] of Object.entries(json) as [string, Section][]) {
  if (!sectionValue || !sectionValue.day_percentage || !sectionValue.bcd_entries) continue;
  md += `### ${sectionName} (${sectionValue.day_percentage})\n\n`;

  const exposures = getAllExposures(sectionValue.bcd_entries);
  if (exposures.length === 0) {
    md += '_No BCD entries._\n\n';
    continue;
  }

  md += `| BCD Entry | ${exposures.join(' | ')} |\n`;
  md += `|-----------|${exposures.map(() => '---').join('|')}|\n`;

  for (const entry of sectionValue.bcd_entries) {
    for (const key in entry) {
      const value = entry[key];
      const row = [key, ...exposures.map(ex => exposureCell(value?.[ex]))];
      md += `| ${row.join(' | ')} |\n`;
    }
  }
  md += '\n';
}

fs.appendFileSync('content/metrics/browser-feature-popularity.md', md, 'utf-8');