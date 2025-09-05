/**
 * OpenAI Client Mock Implementation
 * Following SENTRA project standards: strict TypeScript with branded types
 */
export interface MockEmbeddingResponse {
    readonly object: 'list';
    readonly data: readonly {
        readonly object: 'embedding';
        readonly index: number;
        readonly embedding: readonly number[];
    }[];
    readonly model: string;
    readonly usage: {
        readonly prompt_tokens: number;
        readonly total_tokens: number;
    };
}
export interface MockChatCompletionResponse {
    readonly id: string;
    readonly object: 'chat.completion';
    readonly created: number;
    readonly model: string;
    readonly choices: readonly {
        readonly index: number;
        readonly message: {
            readonly role: 'assistant';
            readonly content: string;
        };
        readonly finish_reason: 'stop' | 'length';
    }[];
    readonly usage: {
        readonly prompt_tokens: number;
        readonly completion_tokens: number;
        readonly total_tokens: number;
    };
}
export declare class MockOpenAIEmbeddings {
    create: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
}
export declare class MockOpenAIChat {
    completions: {
        create: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
    };
}
export declare class MockOpenAI {
    embeddings: MockOpenAIEmbeddings;
    chat: MockOpenAIChat;
    constructor(_config?: {
        apiKey: string;
    });
}
export declare const createMockOpenAI: (config?: {
    apiKey: string;
}) => MockOpenAI;
declare const _default: import("jest-mock").Mock<import("jest-mock").UnknownFunction>;
export default _default;
//# sourceMappingURL=openai.mock.d.ts.map