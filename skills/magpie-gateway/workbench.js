import { openSettings } from 'openfilm/studio';
import { addModel, connection, DEFAULT_MODEL, DEFAULT_PORT } from './connection.mjs';

export default class MagpieGateway extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { display: block; height: 100%; overflow: auto; color: var(--text, inherit); }
        main { width: min(36rem, calc(100% - 2.5rem)); margin: 2rem auto; font: 14px/1.55 system-ui, sans-serif; }
        h1 { font-size: 1.45rem; margin: 0 0 .45rem; }
        p { margin: .45rem 0 1rem; }
        label { display: grid; gap: .3rem; margin: .85rem 0; }
        input, button { box-sizing: border-box; font: inherit; border: 1px solid var(--border, #818181); border-radius: .45rem; padding: .5rem .7rem; }
        input { width: 100%; color: inherit; background: transparent; }
        input[type=number] { width: 9rem; }
        button { cursor: pointer; background: transparent; color: inherit; }
        button[type=submit] { background: #3158c5; color: white; border-color: #3158c5; }
        button:disabled { cursor: wait; opacity: .55; }
        small { display: block; overflow-wrap: anywhere; }
        .actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1.15rem; }
        output { display: block; margin-top: .85rem; overflow-wrap: anywhere; }
      </style>
      <main>
        <h1>Magpie 网关</h1>
        <p>通过本机 Magpie 为 OpenFilm 的智能体提供模型。</p>
        <form>
          <label>Magpie 端口 <input name="port" type="number" min="1" max="65535" required></label>
          <label>模型 ID <input name="model" maxlength="256" spellcheck="false" autocomplete="off" required></label>
          <small>支持图像输入的模型才能加入。其他 ID 可在 Magpie 模型目录里查看。</small>
          <div class="actions">
            <button type="submit">测试并添加</button>
            <button type="button" data-settings>打开智能体设置</button>
          </div>
        </form>
        <output role="status" aria-live="polite"></output>
      </main>`;

    const form = root.querySelector('form');
    const output = root.querySelector('output');
    const submit = root.querySelector('button[type=submit]');
    const port = form.elements.namedItem('port');
    const model = form.elements.namedItem('model');
    port.value = DEFAULT_PORT;
    model.value = DEFAULT_MODEL;
    root.querySelector('[data-settings]').addEventListener('click', () => openSettings('agents'));

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submit.disabled) return;
      try {
        const config = connection(port.value, model.value);
        if (!config.model) throw new Error('请输入一个模型 ID。');
        // Desktop 0.4.1 exposes the same registration method used by Settings → Agents.
        const agents = window.openfilmNative?.agents;
        if (typeof agents?.list !== 'function' || typeof agents.saveOwnModel !== 'function') {
          output.textContent = `当前窗口无法自动添加。请在智能体设置中选择 OpenAI Responses API，填入 ${config.baseUrl}、${config.model} 和本机标识 ${config.key}。`;
          return;
        }
        submit.disabled = true;
        output.textContent = '正在连接 Magpie 并测试图像输入…';
        const result = await addModel(agents, config);
        if (!result?.ok) throw new Error(result?.error || 'OpenFilm 未能保存模型。');
        output.textContent = result.existing
          ? '该模型已在智能体菜单中。'
          : `已添加 Magpie · ${config.model}。在聊天输入框旁的模型菜单中选择它。`;
      } catch (error) {
        output.textContent = `接入失败。${error.message}`;
      } finally {
        submit.disabled = false;
      }
    });
  }
}
