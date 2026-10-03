/**
 * A run stopped on purpose, with the status it ends in: `failed` (a refusal, a score below
 * the threshold, a rule the post breaks) or `skipped`. Anything else thrown is a failure.
 */
export class PipelineStop extends Error {
  constructor(
    message: string,
    readonly status: 'failed' | 'skipped',
  ) {
    super(message);
    this.name = 'PipelineStop';
  }
}
