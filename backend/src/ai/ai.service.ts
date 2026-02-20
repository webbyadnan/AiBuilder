import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { ProjectsService } from '../projects/projects.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AiService {
    private groq: Groq;
    private deepseek: OpenAI;

    constructor(
        private config: ConfigService,
        private projectsService: ProjectsService,
        private supabase: SupabaseService,
    ) {
        this.groq = new Groq({ apiKey: this.config.get('GROQ_API_KEY') });
        this.deepseek = new OpenAI({
            apiKey: this.config.get('DEEPSEEK_API_KEY'),
            baseURL: 'https://api.deepseek.com',
        });
    }

    async generateWebsite(
        userId: string,
        projectId: string,
        prompt: string,
        res: Response,
        isEdit = false,
        selectedElement?: string,
        currentHtml?: string,
    ) {
        // Check credits
        const { data: profile } = await this.supabase.db
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (!profile || profile.credits <= 0) {
            throw new ForbiddenException('Insufficient credits. Please purchase more.');
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const sendEvent = (event: string, data: any) => {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        try {
            // Step 1: Enhance prompt with Groq
            sendEvent('status', { message: 'Analyzing and enhancing your prompt...', step: 1 });

            let enhancedPrompt: string;

            if (isEdit && currentHtml && selectedElement) {
                enhancedPrompt = `The user wants to modify an existing website. 
Selected element: ${selectedElement}
User's change request: ${prompt}
Apply this specific change to the element while keeping the rest of the website intact.`;
            } else {
                const groqResponse = await this.groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: `You are an elite UI/UX strategist and web architect with 15+ years of experience. Transform the user's brief idea into an exhaustive, production-ready website specification.

MUST INCLUDE:
1. SECTIONS: Every page section with specific content (hero, nav, features, testimonials, CTA, footer)
2. DESIGN SYSTEM: Exact color palette, typography (Google Fonts), spacing, border-radius
3. CONTENT: Real, specific, compelling copy for each section — NO placeholders ever
4. ANIMATIONS: Scroll animations, hover effects, micro-interactions details
5. SIGNATURE ELEMENT: One unique design element that makes this site stand out
6. LAYOUT: Grid layouts, card designs, hero composition details

Be extremely detailed — this specification feeds directly into a code generator.`,
                        },
                        { role: 'user', content: prompt },
                    ],
                    max_tokens: 2000,
                });

                enhancedPrompt = groqResponse.choices[0].message.content || prompt;
            }

            sendEvent('enhanced_prompt', { prompt: enhancedPrompt });
            sendEvent('status', { message: 'Building your website...', step: 2 });

            // Step 2: Generate HTML with DeepSeek (streaming)
            let systemPrompt: string;

            if (isEdit && currentHtml) {
                systemPrompt = `You are a world-class frontend engineer. The user wants to modify their website.

CURRENT HTML:
${currentHtml}

MODIFICATION REQUEST: ${enhancedPrompt}

RULES:
- Return the COMPLETE modified HTML file
- Only change what the user requested
- Keep all existing styles, animations, and content intact
- Output ONLY valid HTML starting with <!DOCTYPE html>
- No markdown, no explanations`;
            } else {
                systemPrompt = `You are a world-class frontend engineer and UI designer. Generate a STUNNING, production-ready, single-file HTML website.

STRICT REQUIREMENTS:
- Complete HTML5 + embedded CSS3 + embedded vanilla JavaScript
- Mobile-first responsive design (breakpoints: 768px, 1024px)  
- Modern design: smooth gradients, glassmorphism cards, subtle box-shadows
- ALL content must be REAL and SPECIFIC — absolutely NO placeholder text
- Smooth scroll behavior + scroll-triggered fade-in animations (IntersectionObserver)
- Hover effects on ALL interactive elements with CSS transitions
- CSS custom properties (variables) for entire design system
- Semantic HTML5 elements (header, nav, main, section, article, footer)
- Google Fonts via CDN — no other external dependencies
- Sticky navigation with smooth scroll & mobile hamburger menu
- Hero section with compelling headline + subheadline + CTA button
- At minimum: Hero, Features/Services, About, Testimonials, CTA, Footer sections
- Professional footer with social links and copyright
- Animated gradient backgrounds or particle effects where appropriate

QUALITY BAR: Output must look like it was built by a top-tier design agency charging $10,000.

Output ONLY valid HTML starting with <!DOCTYPE html>. No markdown. No explanations. No code blocks.`;
            }

            const stream = await this.deepseek.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: enhancedPrompt },
                ],
                stream: true,
                max_tokens: 8192,
            });

            let fullHtml = '';

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullHtml += content;
                    sendEvent('chunk', { content });
                }
            }

            // Strip markdown code fences if DeepSeek wrapped the output (e.g. ```html ... ```)
            fullHtml = fullHtml
                .replace(/^```(?:html)?\s*\n?/i, '')
                .replace(/\n?```\s*$/i, '')
                .trim();

            // Ensure it starts with <!DOCTYPE html>
            if (!fullHtml.toLowerCase().startsWith('<!doctype')) {
                const idx = fullHtml.toLowerCase().indexOf('<!doctype');
                if (idx > 0) fullHtml = fullHtml.substring(idx);
            }

            // Step 3: Save and deduct credit
            sendEvent('status', { message: 'Saving your website...', step: 3 });

            await this.projectsService.updateProject(projectId, userId, { html_content: fullHtml });
            await this.projectsService.saveVersion(
                projectId,
                userId,
                fullHtml,
                isEdit ? `Edit: ${prompt.substring(0, 50)}` : 'Initial Generation',
            );
            await this.projectsService.deductCredit(userId);

            // Log to ai_logs
            await this.supabase.db.from('ai_logs').insert({
                user_id: userId,
                project_id: projectId,
                original_prompt: prompt,
                enhanced_prompt: enhancedPrompt,
                model_used: 'deepseek-chat',
                success: true,
            });

            sendEvent('done', { projectId, message: 'Website generated successfully!' });
            res.end();
        } catch (error: any) {
            await this.supabase.db.from('ai_logs').insert({
                user_id: userId,
                project_id: projectId,
                original_prompt: prompt,
                model_used: 'deepseek-chat',
                success: false,
                error_message: error.message,
            });

            sendEvent('error', { message: error.message || 'Generation failed' });
            res.end();
        }
    }
}
