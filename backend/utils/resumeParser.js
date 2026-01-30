const SECTION_KEYWORDS = {
  summary: ['summary', 'professional summary', 'profile', 'objective', 'about me', 'career summary'],
  skills: ['skills', 'technical skills', 'core skills', 'skill set', 'technologies'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'work history'],
  education: ['education', 'academic background', 'academics'],
  projects: ['projects', 'project experience'],
  certifications: ['certifications', 'certification', 'licenses', 'licences'],
};

const HEADING_KEYWORDS = Object.values(SECTION_KEYWORDS).flat();

function normalizeHeading(line) {
  return line
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHeadingLine(line) {
  const normalized = normalizeHeading(line);
  if (!normalized) return false;
  return HEADING_KEYWORDS.some((keyword) => {
    return normalized === keyword || normalized.startsWith(`${keyword} `);
  });
}

function findHeaderEndIndex(lines) {
  for (let i = 0; i < lines.length; i += 1) {
    if (isHeadingLine(lines[i])) return i;
  }
  return Math.min(lines.length, 6);
}

function extractContactInfo(headerLines) {
  const headerText = headerLines.join('\n');
  const emailMatch = headerText.match(/\b[\w.+-]+@[\w.-]+\.\w+\b/);
  const phoneMatch = headerText.match(/\+?\d[\d\s\-()]{7,}\d/);
  const linkedinMatch = headerText.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[^\s]+/i);
  const githubMatch = headerText.match(/(https?:\/\/)?(www\.)?github\.com\/[^\s]+/i);

  let name = '';
  for (const line of headerLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (lower.includes('@') || lower.includes('http') || lower.includes('www') || lower.includes('linkedin') || lower.includes('github')) {
      continue;
    }
    if (/\d/.test(trimmed)) continue;
    if (trimmed.split(/\s+/).length > 4) continue;
    name = trimmed;
    break;
  }

  return {
    name,
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    linkedin: linkedinMatch ? linkedinMatch[0] : '',
    github: githubMatch ? githubMatch[0] : '',
  };
}

function splitSkills(lines) {
  const raw = lines.join(' ');
  return raw
    .split(/[,•\n|•|-]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseSections(bodyLines) {
  const sections = {
    summary: [],
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  };

  let current = null;

  for (const line of bodyLines) {
    if (isHeadingLine(line)) {
      const normalized = normalizeHeading(line);
      const section = Object.entries(SECTION_KEYWORDS).find(([, keywords]) =>
        keywords.some((keyword) => normalized === keyword || normalized.startsWith(`${keyword} `))
      );
      current = section ? section[0] : null;
      continue;
    }
    if (current) {
      sections[current].push(line.trim());
    }
  }

  return sections;
}

function parseResumeText(text) {
  const lines = (text || '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const headerEnd = findHeaderEndIndex(lines);
  const headerLines = lines.slice(0, headerEnd);
  const bodyLines = lines.slice(headerEnd);

  const contact = extractContactInfo(headerLines);
  const sections = parseSections(bodyLines);

  return {
    header: contact,
    summary: sections.summary.join(' '),
    skills: splitSkills(sections.skills),
    experience: sections.experience,
    education: sections.education,
    projects: sections.projects,
    certifications: sections.certifications,
  };
}

module.exports = {
  parseResumeText,
};
