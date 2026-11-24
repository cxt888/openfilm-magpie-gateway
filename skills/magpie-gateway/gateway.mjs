import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { connection, DEFAULT_PORT } from './connection.mjs';

async function savedPort() {
  const config = join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'magpie', 'settings.json');
  try {
    return JSON.parse(await readFile(config, 'utf8')).port ?? DEFAULT_PORT;
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`无法读取 Magpie 的端口配置。${error.message}`);
    return DEFAULT_PORT;
  }
}

async function request(url, options) {
  let response;
  try {
    response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(options.method === 'POST' ? 60_000 : 5_000) });
  } catch (error) {
    throw new Error(`无法连接 ${url}。请确认 Magpie 正在运行。${error.message}`);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    const message = data?.error?.message || response.statusText;
    throw new Error(`Magpie 返回 HTTP ${response.status}。${String(message).slice(0, 240)}`);
  }
  return data;
}

async function main(args) {
  const { values, positionals } = (await import('node:util')).parseArgs({
    args, allowPositionals: true,
    options: { port: { type: 'string' }, json: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } },
  });
  const [command, model, ...extra] = positionals;
  if (values.help || !command) {
    console.log('openfilm magpie-gateway models [--port <端口>] [--json]\nopenfilm magpie-gateway check <模型ID> [--port <端口>] [--json]');
    return;
  }
  if (extra.length || !['models', 'check'].includes(command) || (command === 'check' ? !model : model)) {
    throw new Error('用法错误。运行 openfilm magpie-gateway --help 查看命令。');
  }
  const config = connection(values.port ?? await savedPort(), model);
  const headers = { Authorization: `Bearer ${config.key}` };
  const hello = await request(new URL('/api/hello', config.baseUrl), { headers });
  if (hello.name !== 'magpie') throw new Error('该端口返回的服务不是 Magpie。');
  if (command === 'models') {
    const catalog = await request(`${config.baseUrl}/models`, { headers });
    if (!Array.isArray(catalog.data)) throw new Error('Magpie 返回的模型目录格式不正确。');
    const models = catalog.data.filter(m => typeof m?.id === 'string').map(m => ({ id: m.id, input: m.modalities?.input ?? null }));
    const lines = models.map(m => `${m.id}\t${m.input?.join(', ') ?? '图像能力未标记'}`);
    console.log(values.json ? JSON.stringify({ baseUrl: config.baseUrl, models }, null, 2) : lines.join('\n') || 'Magpie 当前没有启用的聊天模型。');
    return;
  }
  if (!config.model) throw new Error('请输入一个模型 ID。');
  const redPng = await readFile(new URL('./red-test.png', import.meta.url), 'base64');
  const answer = await request(`${config.baseUrl}/responses`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.model, max_output_tokens: 16, input: [{ role: 'user', content: [
      { type: 'input_text', text: 'What color is this picture? One word.' },
      { type: 'input_image', image_url: `data:image/png;base64,${redPng}` },
    ] }] }),
  });
  const text = Array.isArray(answer.output) ? answer.output.flatMap(item => (item.content ?? []).filter(c => c.type === 'output_text').map(c => c.text)).join(' ').trim() : '';
  if (!/^red[.!]?$/i.test(text)) throw new Error('模型未通过红色测试图的识别检查。');
  console.log(values.json ? JSON.stringify({ ok: true, model: config.model, color: text }) : `图像测试通过 · ${config.model}`);
}

main(process.argv.slice(2)).catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
