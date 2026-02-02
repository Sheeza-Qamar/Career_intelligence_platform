/**
 * Resume Chunking Utility
 * Breaks resume text into meaningful chunks for RAG
 */

/**
 * Extract a specific section from resume text
 */
function extractSection(text, pattern) {
  const regex = new RegExp(`${pattern.source}[\\s\\S]*?(?=\\n\\n[A-Z]|$)`, 'i');
  const match = text.match(regex);
  return match ? match[0].replace(pattern, '').trim() : null;
}

/**
 * Split text into chunks of specified size
 */
function splitIntoChunks(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.substring(start, end);
    
    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = chunk.lastIndexOf('.');
      const lastNewline = chunk.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > chunkSize * 0.7) {
        chunk = chunk.substring(0, breakPoint + 1);
        start = start + breakPoint + 1 - overlap;
      } else {
        start = end - overlap;
      }
    } else {
      start = end;
    }
    
    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }
  
  return chunks;
}

/**
 * Chunk resume into meaningful sections
 * @param {string} resumeText - Full resume text
 * @returns {Array<{type: string, text: string, index: number, metadata: object}>}
 */
function chunkResume(resumeText) {
  const chunks = [];
  
  // Extract key sections
  const sections = {
    skills: extractSection(resumeText, /SKILLS?/i) || 
            extractSection(resumeText, /TECHNICAL SKILLS?/i) ||
            extractSection(resumeText, /COMPETENCIES?/i),
    experience: extractSection(resumeText, /EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE/i),
    education: extractSection(resumeText, /EDUCATION|ACADEMIC/i),
    summary: extractSection(resumeText, /SUMMARY|PROFESSIONAL SUMMARY|OBJECTIVE|PROFILE/i),
    projects: extractSection(resumeText, /PROJECTS?/i),
    certifications: extractSection(resumeText, /CERTIFICATIONS?|CERTIFICATES?/i)
  };
  
  // Create chunks for each section
  Object.entries(sections).forEach(([type, text]) => {
    if (text && text.length > 0) {
      // For skills section, keep smaller chunks
      const chunkSize = type === 'skills' ? 300 : 500;
      const sectionChunks = splitIntoChunks(text, chunkSize, 30);
      
      sectionChunks.forEach((chunk, idx) => {
        chunks.push({
          type: type,
          text: chunk,
          index: idx,
          metadata: {
            section: type,
            totalChunks: sectionChunks.length,
            chunkIndex: idx
          }
        });
      });
    }
  });
  
  // If no sections found, chunk the entire text
  if (chunks.length === 0) {
    const textChunks = splitIntoChunks(resumeText, 500, 50);
    textChunks.forEach((chunk, idx) => {
      chunks.push({
        type: 'general',
        text: chunk,
        index: idx,
        metadata: {
          section: 'general',
          totalChunks: textChunks.length,
          chunkIndex: idx
        }
      });
    });
  }
  
  return chunks;
}

module.exports = { chunkResume, splitIntoChunks, extractSection };
