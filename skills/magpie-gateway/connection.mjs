export const DEFAULT_PORT = 3425;
export const DEFAULT_MODEL = 'codex/gpt-6.2-sol';
export const CALLER_KEY = 'magpie-openfilm';

export function connection(port, model = '') {
  const text = String(port).trim();
  const number = Number(text);
  if (!/^\d+$/.test(text) || !Number.isInteger(number) || number < 1 || number > 65535) {
    throw new Error('Magpie 的端口应为 1–65535 之间的整数。');
  }
  const modelId = String(model).trim();
  if (modelId.length > 256 || /\s/.test(modelId)) {
    throw new Error('请填写 Magpie 目录里的完整模型 ID。');
  }
  return { baseUrl: `http://127.0.0.1:${number}/v1`, model: modelId, key: CALLER_KEY, format: 'responses' };
}

export async function addModel(agents, config) {
  const roster = await agents.list();
  const models = roster.find(agent => agent.id === 'byok')?.byok?.models ?? [];
  const existing = models.find(model => model.baseUrl === config.baseUrl && model.model === config.model && model.format === config.format);
  if (existing) return { ok: true, existing: true };

  return agents.saveOwnModel({ ...config, name: `Magpie · ${config.model}`, levels: ['auto'], effort: 'auto' });
}
