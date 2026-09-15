import type { Payload, WorkflowConfig } from 'payload';
import { runPipeline } from '@/modules/ai-content/pipeline/run';
import type {
  PipelineInput,
  PipelineResult,
  StepRunner,
} from '@/modules/ai-content/pipeline/types';
import { providerOrRefusal } from '@/modules/ai-content/provider';
import { payloadStore } from '@/modules/ai-content/store/payload-store';

export const GENERATE_POST = 'generatePost' as const;
export const AI_QUEUE = 'ai' as const;

export interface GeneratePostInput {
  topicId?: number;
  manual?: boolean;
  replacePostId?: number;
  kind?: 'generate' | 'freshness';
}

/**
 * Runs the pipeline for a Payload instance: the store on the Local API, the provider from
 * the settings, and each step as an inline task of the job (retried on its own, logged in
 * the job's task status). Used by the workflow and, with a plain runner, by scripts.
 */
export async function generatePost(
  payload: Payload,
  input: PipelineInput,
  run: StepRunner = async (_name, fn) => fn(),
): Promise<PipelineResult> {
  const store = payloadStore(payload);
  // The provider is built before the topic is known; the mock reads the sheet by unit, not by language.
  const [settings, facts] = await Promise.all([store.settings(), store.facts('ar')]);
  const provider = providerOrRefusal(settings, facts);
  return runPipeline({ store, provider, now: () => new Date(), run }, input);
}

/**
 * The `generatePost` workflow (BRD 10.2.4): one job per run on the `ai` queue, which the
 * autorun serves one at a time. Every step is an inline task with its own retries; the
 * workflow itself does not retry (a failed run is recorded and the topic marked).
 */
export const generatePostWorkflow: WorkflowConfig<GeneratePostInput> = {
  slug: GENERATE_POST,
  label: 'Content engine: generate a post',
  queue: AI_QUEUE,
  inputSchema: [
    { name: 'topicId', type: 'number' },
    { name: 'manual', type: 'checkbox' },
    { name: 'replacePostId', type: 'number' },
    { name: 'kind', type: 'text' },
  ],
  handler: async ({ job, inlineTask, req }) => {
    const counters = new Map<string, number>();
    // Inline task ids must be unique per job: the second review is `review#2`.
    const run: StepRunner = async (name, fn, options) => {
      const n = (counters.get(name) ?? 0) + 1;
      counters.set(name, n);
      const { value } = await inlineTask(`${name}#${n}`, {
        retries: options?.retries ?? 0,
        task: async () => ({ output: { value: await fn() } }),
      });
      return value as Awaited<ReturnType<typeof fn>>;
    };
    const input = job.input as GeneratePostInput;
    const result = await generatePost(
      req.payload,
      {
        ...(input.topicId ? { topicId: input.topicId } : {}),
        ...(input.manual ? { manual: true } : {}),
        ...(input.replacePostId ? { replacePostId: input.replacePostId } : {}),
        ...(input.kind === 'freshness' ? { kind: 'freshness' as const } : {}),
      },
      run,
    );
    req.payload.logger.info({
      msg: `content engine: ${result.status}${result.reason ? ` (${result.reason})` : ''}`,
      run: result.runId,
      post: result.postId,
      score: result.score,
    });
  },
};

/** Queues one run; the `ai` autorun picks it up within a minute. */
export async function queueGeneratePost(payload: Payload, input: GeneratePostInput) {
  return payload.jobs.queue({ workflow: GENERATE_POST, queue: AI_QUEUE, input });
}
