const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

exports.extractText = async (filePath, mimetype) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        if (mimetype === 'application/pdf') {
            const parser = new PDFParse({ data: dataBuffer });
            const data = await parser.getText();
            await parser.destroy();
            if (!data.text || data.text.trim().length < 50) {
                throw new Error("Extracted text is empty or too short");
            }
            return data.text;
        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const data = await mammoth.extractRawText({ buffer: dataBuffer });
            if (!data.value || data.value.trim().length < 50) throw new Error('The DOCX file does not contain readable resume text.');
            return data.value;
        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const data = await mammoth.extractRawText({ buffer: dataBuffer });
            if (!data.value || data.value.trim().length < 50) throw new Error('The DOCX file does not contain readable resume text.');
            return data.value;
        } else if (mimetype === 'text/plain') {
            const text = dataBuffer.toString('utf8');
            if (!text || text.trim().length < 50) {
                throw new Error("Extracted text is empty or too short");
            }
            return text;
        } else {
            throw new Error("Unsupported file type");
        }
    } catch (error) {
        throw error;
    }
};
