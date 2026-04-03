// 127.0.0.1 use karna zyada reliable hota hai local development mein
const API_URL = "http://127.0.0.1:8000/api"; 

export const api = {
  // ✅ Get Inbox Emails
  getInbox: async () => {
    try {
      const res = await fetch(`${API_URL}/inbox/unread`);
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("api.getInbox error:", error);
      throw error;
    }
  },

  // ✅ Run Pipeline
  runPipeline: async () => {
    try {
      const res = await fetch(`${API_URL}/pipeline`, {
        method: "POST",
        // Empty body or headers if needed, but simple POST is fine
      });
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("api.runPipeline error:", error);
      throw error;
    }
  },

  // ✅ Send Email
  sendEmail: async (data: { to: string; subject: string; body: string }) => {
    try {
      const res = await fetch(`${API_URL}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Server Error: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("api.sendEmail error:", error);
      throw error;
    }
  },

  // ✅ Whisper Transcription
  transcribe: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file); // Backend expects "file" key

      const res = await fetch(`${API_URL}/transcribe`, {
        method: "POST",
        // Note: Don't set Content-Type header here, 
        // browser will automatically set it with boundary for FormData
        body: formData,
      });
      if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("api.transcribe error:", error);
      throw error;
    }
  },

  // ✅ AI Extraction
  extractData: async (transcript: string) => {
    try {
      const res = await fetch(`${API_URL}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error(`Extraction failed: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("api.extractData error:", error);
      throw error;
    }
  }
};