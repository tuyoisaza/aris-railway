class WebResearchService {
    constructor() {
        this.exaApiKey = process.env.EXA_API_KEY;
        this.exaBaseUrl = 'https://api.exa.ai';
    }

    async search(query, options = {}) {
        const maxResults = options.maxResults || 5;
        
        if (this.exaApiKey) {
            return this.searchWithExa(query, maxResults);
        }
        
        return this.searchWithOpenAI(query, maxResults);
    }

    async searchWithExa(query, maxResults) {
        try {
            const response = await fetch(`${this.exaBaseUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.exaApiKey}`
                },
                body: JSON.stringify({
                    query,
                    numResults: maxResults,
                    type: 'auto',
                    contents: {
                        text: true,
                        highlights: true
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Exa API error: ${response.status}`);
            }

            const data = await response.json();
            return {
                results: data.results || [],
                query: data.query,
                total: data.total || 0
            };
        } catch (err) {
            console.error('[WebResearch] Exa search error:', err);
            return { results: [], query, error: err.message };
        }
    }

    async searchWithOpenAI(query, maxResults) {
        try {
            const response = await fetch('https://api.openai.com/v1/responses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    input: `Search the web for: ${query}. Return a JSON array with search results containing: title, url, snippet, and source.`,
                    tools: [{ type: 'web_search_preview' }]
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI search error: ${response.status}`);
            }

            const data = await response.json();
            const webResults = data.output?.[0]?.content?.[0]?.text || '[]';
            
            try {
                return { results: JSON.parse(webResults), query };
            } catch {
                return { results: [], query, raw: webResults };
            }
        } catch (err) {
            console.error('[WebResearch] OpenAI search error:', err);
            return { results: [], query, error: err.message };
        }
    }

    async fetchContent(url) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'ARIS/1.0 (Educational AI Assistant)'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const html = await response.text();
            return this.extractText(html, url);
        } catch (err) {
            console.error('[WebResearch] Fetch error:', err);
            return null;
        }
    }

    extractText(html, url) {
        const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        return {
            text: text.substring(0, 10000),
            url,
            title: this.extractTitle(html),
            snippet: text.substring(0, 500)
        };
    }

    extractTitle(html) {
        const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        return match ? match[1].trim() : 'Untitled';
    }

    async researchAndSummarize(query) {
        const searchResults = await this.search(query, { maxResults: 5 });
        
        if (!searchResults.results || searchResults.results.length === 0) {
            return {
                query,
                summary: 'No results found.',
                sources: [],
                error: searchResults.error
            };
        }

        const sources = searchResults.results.map(r => ({
            title: r.title || r.name,
            url: r.url,
            snippet: r.snippet || r.description || ''
        }));

        const summaryPrompt = `Based on web search results for "${query}", provide a comprehensive summary:

Search Results:
${sources.map((s, i) => `${i + 1}. ${s.title}\n   ${s.snippet}\n   Source: ${s.url}`).join('\n')}

Provide a 2-3 paragraph summary synthesizing this information.`;

        let summary = 'Unable to generate summary.';
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are a helpful research assistant. Provide accurate, well-organized summaries.' },
                        { role: 'user', content: summaryPrompt }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3
                })
            });

            if (response.ok) {
                const data = await response.json();
                summary = data.choices?.[0]?.message?.content || summary;
            }
        } catch (err) {
            console.error('[WebResearch] Summary error:', err);
        }

        return {
            query,
            summary,
            sources,
            searchResults: searchResults.results
        };
    }
}

export default new WebResearchService();
