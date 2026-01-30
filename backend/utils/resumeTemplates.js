function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderList(items) {
  if (!Array.isArray(items) || items.length === 0) return '<p class="muted">No data provided.</p>';
  return `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
}

function renderParagraphs(items) {
  if (!Array.isArray(items) || items.length === 0) return '<p class="muted">No data provided.</p>';
  return items.map((i) => `<p>${escapeHtml(i)}</p>`).join('');
}

function renderHeader(contact) {
  const parts = [];
  if (contact.email) parts.push(contact.email);
  if (contact.phone) parts.push(contact.phone);
  if (contact.linkedin) parts.push(contact.linkedin);
  if (contact.github) parts.push(contact.github);
  return parts.length ? `<div class="contact">${parts.map(escapeHtml).join(' • ')}</div>` : '';
}

function baseStyles() {
  return `
    <style>
      .resume { font-family: Arial, sans-serif; color: #0f172a; }
      .resume h1 { font-size: 24px; margin: 0 0 4px; }
      .resume h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; margin: 18px 0 6px; }
      .resume p, .resume li { font-size: 13px; line-height: 1.5; margin: 0 0 6px; }
      .resume ul { margin: 0 0 6px 18px; padding: 0; }
      .contact { font-size: 12px; color: #475569; margin-bottom: 10px; }
      .muted { color: #94a3b8; font-size: 12px; }
      .section { margin-bottom: 10px; }
      .skills-inline { font-size: 12px; color: #334155; }
      .divider { height: 1px; background: #e2e8f0; margin: 10px 0; }
    </style>
  `;
}

function templateClassic(data) {
  return `
    ${baseStyles()}
    <div class="resume">
      <h1>${escapeHtml(data.header.name || 'Your Name')}</h1>
      ${renderHeader(data.header)}
      <div class="section">
        <h2>Summary</h2>
        <p>${escapeHtml(data.summary || 'Add a short professional summary.')}</p>
      </div>
      <div class="section">
        <h2>Skills</h2>
        ${renderList(data.skills)}
      </div>
      <div class="section">
        <h2>Experience</h2>
        ${renderParagraphs(data.experience)}
      </div>
      <div class="section">
        <h2>Education</h2>
        ${renderParagraphs(data.education)}
      </div>
      <div class="section">
        <h2>Projects</h2>
        ${renderParagraphs(data.projects)}
      </div>
    </div>
  `;
}

function templateTechnical(data) {
  return `
    ${baseStyles()}
    <div class="resume">
      <h1>${escapeHtml(data.header.name || 'Your Name')}</h1>
      ${renderHeader(data.header)}
      <div class="section">
        <h2>Technical Skills</h2>
        ${renderList(data.skills)}
      </div>
      <div class="section">
        <h2>Projects</h2>
        ${renderParagraphs(data.projects)}
      </div>
      <div class="section">
        <h2>Experience</h2>
        ${renderParagraphs(data.experience)}
      </div>
      <div class="section">
        <h2>Education</h2>
        ${renderParagraphs(data.education)}
      </div>
      <div class="section">
        <h2>Certifications</h2>
        ${renderParagraphs(data.certifications)}
      </div>
    </div>
  `;
}

function templateCompact(data) {
  const summaryLine = data.summary || 'Add a short professional summary.';
  return `
    ${baseStyles()}
    <div class="resume">
      <h1>${escapeHtml(data.header.name || 'Your Name')}</h1>
      ${renderHeader(data.header)}
      <p>${escapeHtml(summaryLine)}</p>
      <div class="divider"></div>
      <div class="section">
        <h2>Skills</h2>
        <p class="skills-inline">${escapeHtml((data.skills || []).join(' • ') || 'Add your skills')}</p>
      </div>
      <div class="section">
        <h2>Experience</h2>
        ${renderParagraphs(data.experience)}
      </div>
      <div class="section">
        <h2>Education</h2>
        ${renderParagraphs(data.education)}
      </div>
    </div>
  `;
}

function buildTemplates(data) {
  return [
    { id: 'classic', title: 'Classic ATS', html: templateClassic(data) },
    { id: 'technical', title: 'Technical ATS', html: templateTechnical(data) },
    { id: 'compact', title: 'Compact ATS', html: templateCompact(data) },
  ];
}

module.exports = {
  buildTemplates,
};
