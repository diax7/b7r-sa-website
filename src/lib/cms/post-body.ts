import { flattenTopLevelFields, type Payload, type RichTextField } from 'payload';

/**
 * The post body's rich-text field from the running config, for the Markdown conversions of
 * the seeds and the engine. It sits inside the Content tab (ADR-046), so the lookup goes
 * through Payload's flattener, never the top-level list. A leaf module: the seeds import it
 * before they load the environment.
 */
export function postBodyField(payload: Payload): RichTextField {
  const field = flattenTopLevelFields(payload.collections['posts']?.config.fields ?? []).find(
    (f) => 'name' in f && f.name === 'body',
  );
  if (!field || field.type !== 'richText') throw new Error('posts: no body field');
  return field;
}
