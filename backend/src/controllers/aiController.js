const Groq = require('groq-sdk');

const analyzeProjectData = async (req, res) => {
    const { overallStats, projects } = req.body;

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({
            message: 'Groq API Key is not configured on the server.'
        });
    }

    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });

    try {
        // Limit data to prevent token overflow (Top 20 projects)
        const summarizedProjects = projects.slice(0, 20).map(p => ({
            name: p.name,
            status: p.status,
            progress: p.progress,
            taskCount: p.tasks?.length || 0,
            overdueTasks: (p.tasks || []).filter(t => t.status !== 'COMPLETED' && new Date(t.dueDate) < new Date()).length
        }));

        const prompt = `
        You are a professional project management analyst providing high-level portfolio insights.
        Analyze the following project data and provide a structured executive report in Markdown.

        Data Context:
        - Overall Stats: Total Projects: ${overallStats.totalProjects}, Avg Progress: ${overallStats.avgProgress}%, Active Users: ${overallStats.activeUsers}, Total Hours: ${overallStats.totalHours}
        - Top 20 Projects: ${JSON.stringify(summarizedProjects, null, 2)}

        Report Requirements (Markdown Sections):
        1. Executive Summary: A 2-3 sentence overview of portfolio health.
        2. Key Risks: Identify 2-3 projects or areas needing immediate attention.
        3. Team Performance: Briefly comment on workload/hours context.
        4. Strategic Recommendations: 2-3 actionable bullet points for the next week.

        Use professional language and maintain a concise, executive-focused tone.
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a professional project management analyst providing high-level portfolio insights."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
        });

        res.json({
            analysis: chatCompletion.choices[0]?.message?.content || "Unable to generate analysis."
        });

    } catch (error) {
        console.error('Groq AI Error:', error);

        if (error.status === 429) {
            return res.status(429).json({
                message: 'AI Rate limit reached. Please try again in a few minutes.'
            });
        }

        res.status(500).json({
            message: 'Error generating AI analysis.',
            error: error.message
        });
    }
};

module.exports = {
    analyzeProjectData
};
