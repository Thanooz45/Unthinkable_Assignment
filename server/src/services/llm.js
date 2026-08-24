const { GoogleGenAI } = require('@google/genai');
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

let ai = null;

const getAI = () => {
    if (!ai) {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY });
    }
    return ai;
};

const cleanJSON = (text) => {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
};

const knownSkills = ['JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Python', 'Java', 'C++', 'C#', 'SQL', 'MongoDB', 'MySQL', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Git', 'GitHub', 'REST', 'GraphQL', 'HTML', 'CSS', 'Figma', 'Machine Learning', 'TensorFlow', 'Pandas', 'Excel', 'Power BI'];
const fallbackProfile = text => ({
    name: text.match(/^[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3}/m)?.[0] || 'Unknown candidate',
    email: text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '',
    phone: text.match(/(?:\+?\d[\d\s().-]{8,}\d)/)?.[0] || '',
    skills: knownSkills.filter(skill => new RegExp(`\\b${skill.replace('.', '\\.') }\\b`, 'i').test(text)),
    experience_years: Number(text.match(/(\d+)\+?\s*(?:years|yrs)/i)?.[1] || 0),
    education: text.match(/(?:Bachelor|Master|B\.Tech|M\.Tech|B\.E|M\.E|BSc|MSc)[^\n]{0,120}/i)?.[0] || '',
    summary: 'Resume parsed successfully. Add a job description to generate a detailed fit analysis.'
});

const parseResponse = (text, resumeText) => {
    const profile = JSON.parse(cleanJSON(text));
    const fallback = fallbackProfile(resumeText);
    return { ...fallback, ...profile, skills: Array.isArray(profile.skills) ? profile.skills : fallback.skills };
};

exports.extractStructuredData = async (resumeText) => {
    const prompt = `Extract the following details from this resume text into valid JSON format:
{
  "name": "Candidate Name",
  "email": "email address or empty string",
  "phone": "phone number or empty string",
  "skills": ["Skill 1", "Skill 2"],
  "experience_years": number,
  "education": "Degree and University",
  "summary": "A concise 2-3 sentence professional summary of the candidate's skills, seniority, strengths, and career focus."
}

Resume text:
${resumeText}`;

    try {
        const response = await getAI().models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                 responseMimeType: "application/json",
            }
        });
        const resultText = response.text;
        return parseResponse(resultText, resumeText);
    } catch (err) {
        console.error("Extraction failed, retrying once", err);
        try {
             const response = await getAI().models.generateContent({
                model: MODEL,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });
            const resultText = response.text;
            return parseResponse(resultText, resumeText);
        } catch (e2) {
             console.error('LLM extraction unavailable; using local profile extraction.', e2.message);
             return fallbackProfile(resumeText);
        }
    }
};

exports.scoreMatch = async (jobDescription, parsedResumeData) => {
    const prompt = `Compare the following resume data with this job description.
Rate the candidate's fit on a scale of 1-10 and provide a clear justification.

Job Description:
${jobDescription}

Resume:
${JSON.stringify(parsedResumeData)}

Return JSON format:
{
  "score": 8,
  "justification": "Strong match in React and Node.js; lacks AWS experience."
}`;

    try {
        const response = await getAI().models.generateContent({
            model: MODEL,
            contents: prompt,
            config: {
                 responseMimeType: "application/json",
            }
        });
        const resultText = response.text;
        return JSON.parse(cleanJSON(resultText));
    } catch (err) {
        console.error("Scoring failed, retrying once", err);
        try {
            const response = await getAI().models.generateContent({
                model: MODEL,
                contents: prompt,
                config: {
                     responseMimeType: "application/json",
                }
            });
            const resultText = response.text;
            return JSON.parse(cleanJSON(resultText));
        } catch (e2) {
             const skills = parsedResumeData.skills || [];
             const matches = skills.filter(skill => jobDescription.toLowerCase().includes(String(skill).toLowerCase()));
             return { score: Math.min(10, Math.max(1, 4 + matches.length)), justification: `Fallback evaluation: matched ${matches.length} resume skill${matches.length === 1 ? '' : 's'} to the job description (${matches.join(', ') || 'no direct keyword matches'}). Gemini was unavailable, so re-run screening after checking the API key for a detailed AI explanation.` };
        }
    }
};
