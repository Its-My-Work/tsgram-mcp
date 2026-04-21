import { OpenAI } from 'openai';
import { ChatHistory } from '../utils/ChatHistory.js';
import { AIModelAPI, DeepSeekConfig, ChatMessage } from '../types/index.js';

export class DeepSeekAPI implements AIModelAPI {
  private client: OpenAI;
  private history: ChatHistory;
  private model: string;
  private maxTokens: number;

  constructor(config: DeepSeekConfig) {
    this.client = new OpenAI({
      baseURL: config.apiBase || 'https://api.deepseek.com',
      apiKey: config.apiKey,
    });

    this.model = config.model || 'deepseek-chat';
    this.history = new ChatHistory(config.maxHistory || 5);
    this.maxTokens = config.maxTokens || 1024;
  }

  async send(text: string): Promise<string> {
    const newMessage: ChatMessage = { role: 'user', content: text };
    this.history.append(newMessage);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: this.history.getMessages(),
        max_tokens: this.maxTokens,
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0]?.message?.content;
      if (!assistantMessage) {
        throw new Error('No response from DeepSeek API');
      }

      this.history.append({ role: 'assistant', content: assistantMessage });
      return assistantMessage.trim();
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw new Error(`DeepSeek API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  clearHistory(): void {
    this.history.clear();
  }

  setModel(model: string): void {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  // Get available models from DeepSeek (hardcoded for now)
  async getAvailableModels(): Promise<string[]> {
    return [
      'deepseek-chat',
      'deepseek-coder',
    ];
  }
}