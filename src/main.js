import QRCode from 'qrcode';
import './style.css';

const app = document.querySelector('#app');

const templateDefinitions = {
  free: {
    label: '自由输入',
    hint: '输入任意文本、链接或备注。',
    buildContent: (fields) => fields.raw ?? ''
  },
  wifi: {
    label: 'Wi-Fi',
    hint: '生成可供手机直接识别的 Wi-Fi 配置。',
    fields: [
      { key: 'ssid', label: '网络名称', placeholder: 'MyWiFi' },
      { key: 'password', label: '密码', placeholder: '12345678' },
      {
        key: 'encryption',
        label: '加密方式',
        type: 'select',
        options: [
          { value: 'WPA', label: 'WPA/WPA2' },
          { value: 'WEP', label: 'WEP' },
          { value: 'nopass', label: '无密码' }
        ]
      },
      { key: 'hidden', label: '隐藏网络', type: 'checkbox' }
    ],
    buildContent: (fields) => {
      if (!fields.ssid) {
        return '';
      }

      const safeSsid = escapeTemplateValue(fields.ssid);
      const safePassword = escapeTemplateValue(fields.password ?? '');

      return `WIFI:T:${fields.encryption || 'WPA'};S:${safeSsid};P:${safePassword};H:${fields.hidden ? 'true' : 'false'};;`;
    }
  },
  contact: {
    label: '名片',
    hint: '输出 vCard 文本，方便手机扫码保存联系人。',
    fields: [
      { key: 'name', label: '姓名', placeholder: '张三' },
      { key: 'org', label: '公司', placeholder: 'Acme Studio' },
      { key: 'title', label: '职位', placeholder: 'Product Designer' },
      { key: 'phone', label: '电话', placeholder: '+86 13800000000' },
      { key: 'email', label: '邮箱', placeholder: 'name@example.com' },
      { key: 'website', label: '网站', placeholder: 'https://example.com' },
      { key: 'address', label: '地址', placeholder: '上海市静安区 XX 路 100 号' }
    ],
    buildContent: (fields) => {
      if (!fields.name && !fields.phone && !fields.email) {
        return '';
      }

      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${fields.name ?? ''}`,
        `ORG:${fields.org ?? ''}`,
        `TITLE:${fields.title ?? ''}`,
        `TEL:${fields.phone ?? ''}`,
        `EMAIL:${fields.email ?? ''}`,
        `URL:${fields.website ?? ''}`,
        `ADR:;;${fields.address ?? ''}`,
        'END:VCARD'
      ].join('\n');
    }
  },
  sms: {
    label: '短信',
    hint: '扫码后可直接打开短信编辑页。',
    fields: [
      { key: 'phone', label: '收件号码', placeholder: '+86 13800000000' },
      { key: 'message', label: '短信内容', placeholder: '你好，稍后联系。' }
    ],
    buildContent: (fields) => {
      if (!fields.phone) {
        return '';
      }

      return `SMSTO:${fields.phone}:${fields.message ?? ''}`;
    }
  },
  email: {
    label: '邮箱',
    hint: '扫码后可直接打开邮件客户端。',
    fields: [
      { key: 'to', label: '收件邮箱', placeholder: 'hello@example.com' },
      { key: 'subject', label: '主题', placeholder: '合作咨询' },
      { key: 'body', label: '正文', placeholder: '你好，我想进一步了解。' }
    ],
    buildContent: (fields) => {
      if (!fields.to) {
        return '';
      }

      const params = new URLSearchParams();

      if (fields.subject) {
        params.set('subject', fields.subject);
      }

      if (fields.body) {
        params.set('body', fields.body);
      }

      const query = params.toString();
      return `mailto:${fields.to}${query ? `?${query}` : ''}`;
    }
  }
};

app.innerHTML = `
  <main class="shell">
    <section class="hero-panel">
      <p class="eyebrow">Pure Frontend QR Studio</p>
      <h1>把任何输入，立即变成二维码。</h1>
      <p class="hero-copy">
        支持文本、链接、联系方式、命令片段，全部在浏览器本地生成，不经过服务器。
      </p>

      <div class="composer">
        <section class="template-panel">
          <div class="section-head">
            <span>常用模板</span>
            <p id="template-hint">输入任意文本、链接或备注。</p>
          </div>
          <div id="template-tabs" class="template-tabs"></div>
          <div id="template-fields" class="template-fields"></div>
        </section>

        <label class="field field-large" for="content-input">
          <span>输入内容</span>
          <textarea id="content-input" placeholder="输入任意内容，例如 https://example.com、Wi-Fi 信息、备注文本...">https://example.com</textarea>
        </label>

        <div class="controls">
          <label class="field" for="size-input">
            <span>尺寸</span>
            <input id="size-input" type="range" min="160" max="420" step="20" value="260" />
            <strong id="size-value">260 px</strong>
          </label>

          <label class="field" for="margin-input">
            <span>留白</span>
            <input id="margin-input" type="range" min="0" max="8" step="1" value="2" />
            <strong id="margin-value">2</strong>
          </label>
        </div>

        <div class="controls controls-double">
          <label class="field" for="dark-color-input">
            <span>前景色</span>
            <input id="dark-color-input" type="color" value="#102a43" />
          </label>

          <label class="field" for="light-color-input">
            <span>背景色</span>
            <input id="light-color-input" type="color" value="#fefbf4" />
          </label>
        </div>

        <div class="controls controls-double logo-row">
          <label class="field" for="logo-input">
            <span>中心 Logo</span>
            <input id="logo-input" type="file" accept="image/*" />
          </label>

          <div class="field logo-actions">
            <span>Logo 操作</span>
            <button id="remove-logo-button" type="button" class="ghost subtle">移除 Logo</button>
            <p id="logo-name" class="microcopy">未上传 Logo</p>
          </div>
        </div>

        <div class="actions">
          <button id="download-button" type="button">下载 PNG</button>
          <button id="clear-button" type="button" class="ghost">清空</button>
        </div>
      </div>
    </section>

    <aside class="preview-panel">
      <div class="preview-card">
        <div class="preview-head">
          <p>实时预览</p>
          <span id="status-text">已生成</span>
        </div>
        <canvas id="qr-canvas" width="260" height="260" aria-label="二维码预览"></canvas>
        <p id="hint-text" class="hint-text">二维码会随着输入自动更新。</p>
      </div>
    </aside>
  </main>
`;

const contentInput = document.querySelector('#content-input');
const sizeInput = document.querySelector('#size-input');
const marginInput = document.querySelector('#margin-input');
const darkColorInput = document.querySelector('#dark-color-input');
const lightColorInput = document.querySelector('#light-color-input');
const logoInput = document.querySelector('#logo-input');
const removeLogoButton = document.querySelector('#remove-logo-button');
const logoName = document.querySelector('#logo-name');
const templateTabs = document.querySelector('#template-tabs');
const templateFields = document.querySelector('#template-fields');
const templateHint = document.querySelector('#template-hint');
const sizeValue = document.querySelector('#size-value');
const marginValue = document.querySelector('#margin-value');
const downloadButton = document.querySelector('#download-button');
const clearButton = document.querySelector('#clear-button');
const statusText = document.querySelector('#status-text');
const hintText = document.querySelector('#hint-text');
const canvas = document.querySelector('#qr-canvas');

const state = {
  template: 'free',
  templateValues: {
    free: {
      raw: contentInput.value
    }
  },
  content: contentInput.value,
  size: Number(sizeInput.value),
  margin: Number(marginInput.value),
  darkColor: darkColorInput.value,
  lightColor: lightColorInput.value,
  logoImage: null,
  logoName: ''
};

function escapeTemplateValue(value) {
  return String(value).replace(/([\\;,:\"])/g, '\\$1');
}

function getTemplateValues(templateKey) {
  if (!state.templateValues[templateKey]) {
    state.templateValues[templateKey] = {};
  }

  return state.templateValues[templateKey];
}

function applyTemplateContent() {
  const definition = templateDefinitions[state.template];
  const values = getTemplateValues(state.template);
  const nextContent = definition.buildContent(values);

  state.content = nextContent;
  contentInput.value = nextContent;
  renderQrCode();
}

function renderTemplateFields() {
  const definition = templateDefinitions[state.template];
  const values = getTemplateValues(state.template);

  templateHint.textContent = definition.hint;

  templateTabs.innerHTML = Object.entries(templateDefinitions)
    .map(
      ([key, item]) => `
        <button
          type="button"
          class="template-tab ${key === state.template ? 'is-active' : ''}"
          data-template="${key}"
        >
          ${item.label}
        </button>
      `
    )
    .join('');

  if (!definition.fields) {
    templateFields.innerHTML = '<p class="microcopy">自由输入模式下，可直接编辑下方内容。</p>';
    return;
  }

  templateFields.innerHTML = definition.fields
    .map((field) => {
      if (field.type === 'checkbox') {
        return `
          <label class="field field-inline" for="field-${field.key}">
            <span>${field.label}</span>
            <input id="field-${field.key}" data-field-key="${field.key}" type="checkbox" ${values[field.key] ? 'checked' : ''} />
          </label>
        `;
      }

      if (field.type === 'select') {
        return `
          <label class="field" for="field-${field.key}">
            <span>${field.label}</span>
            <select id="field-${field.key}" data-field-key="${field.key}">
              ${field.options
                .map(
                  (option) => `
                    <option value="${option.value}" ${String(values[field.key] ?? field.options[0].value) === option.value ? 'selected' : ''}>
                      ${option.label}
                    </option>
                  `
                )
                .join('')}
            </select>
          </label>
        `;
      }

      const isLongField = field.key === 'message' || field.key === 'body' || field.key === 'address';

      return `
        <label class="field" for="field-${field.key}">
          <span>${field.label}</span>
          ${
            isLongField
              ? `<textarea id="field-${field.key}" data-field-key="${field.key}" placeholder="${field.placeholder ?? ''}">${values[field.key] ?? ''}</textarea>`
              : `<input id="field-${field.key}" data-field-key="${field.key}" type="text" value="${escapeHtml(values[field.key] ?? '')}" placeholder="${field.placeholder ?? ''}" />`
          }
        </label>
      `;
    })
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function syncTemplateField(event) {
  const target = event.target;
  const fieldKey = target.dataset.fieldKey;

  if (!fieldKey) {
    return;
  }

  const templateValues = getTemplateValues(state.template);
  templateValues[fieldKey] = target.type === 'checkbox' ? target.checked : target.value;
  applyTemplateContent();
}

async function drawLogoOverlay() {
  if (!state.logoImage) {
    return;
  }

  const context = canvas.getContext('2d');
  const logoSize = Math.round(state.size * 0.22);
  const padding = Math.max(10, Math.round(logoSize * 0.18));
  const frameSize = logoSize + padding * 2;
  const x = Math.round((state.size - frameSize) / 2);
  const y = Math.round((state.size - frameSize) / 2);
  const radius = Math.max(16, Math.round(frameSize * 0.22));

  context.save();
  context.fillStyle = state.lightColor;
  drawRoundedRect(context, x, y, frameSize, frameSize, radius);
  context.fill();
  context.shadowColor = 'rgba(16, 42, 67, 0.18)';
  context.shadowBlur = 18;
  context.drawImage(state.logoImage, x + padding, y + padding, logoSize, logoSize);
  context.restore();
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function readLogoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('logo-load-failed'));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error('logo-read-failed'));
    reader.readAsDataURL(file);
  });
}

async function renderQrCode() {
  const trimmedContent = state.content.trim();

  sizeValue.textContent = `${state.size} px`;
  marginValue.textContent = `${state.margin}`;
  canvas.width = state.size;
  canvas.height = state.size;

  if (!trimmedContent) {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    statusText.textContent = '等待输入';
    hintText.textContent = '先输入内容，再生成二维码。';
    downloadButton.disabled = true;
    return;
  }

  try {
    await QRCode.toCanvas(canvas, trimmedContent, {
      width: state.size,
      margin: state.margin,
      color: {
        dark: state.darkColor,
        light: state.lightColor
      }
    });
    await drawLogoOverlay();
    statusText.textContent = '已生成';
    hintText.textContent = '二维码已同步到预览区，可直接下载 PNG。';
    downloadButton.disabled = false;
  } catch (error) {
    statusText.textContent = '生成失败';
    hintText.textContent = '当前输入无法转换为二维码，请调整后重试。';
    downloadButton.disabled = true;
    console.error(error);
  }
}

contentInput.addEventListener('input', (event) => {
  state.content = event.target.value;
  getTemplateValues('free').raw = event.target.value;

  if (state.template === 'free') {
    state.templateValues.free.raw = event.target.value;
  }

  renderQrCode();
});

sizeInput.addEventListener('input', (event) => {
  state.size = Number(event.target.value);
  renderQrCode();
});

marginInput.addEventListener('input', (event) => {
  state.margin = Number(event.target.value);
  renderQrCode();
});

darkColorInput.addEventListener('input', (event) => {
  state.darkColor = event.target.value;
  renderQrCode();
});

lightColorInput.addEventListener('input', (event) => {
  state.lightColor = event.target.value;
  renderQrCode();
});

logoInput.addEventListener('change', async (event) => {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  try {
    state.logoImage = await readLogoFile(file);
    state.logoName = file.name;
    logoName.textContent = `当前 Logo：${file.name}`;
    renderQrCode();
  } catch (error) {
    state.logoImage = null;
    state.logoName = '';
    logoName.textContent = 'Logo 读取失败，请换一张图片。';
    console.error(error);
  }
});

removeLogoButton.addEventListener('click', () => {
  state.logoImage = null;
  state.logoName = '';
  logoInput.value = '';
  logoName.textContent = '未上传 Logo';
  renderQrCode();
});

templateTabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-template]');

  if (!button) {
    return;
  }

  state.template = button.dataset.template;
  renderTemplateFields();
  applyTemplateContent();
});

templateFields.addEventListener('input', syncTemplateField);
templateFields.addEventListener('change', syncTemplateField);

downloadButton.addEventListener('click', () => {
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  link.download = `qrcode-${timestamp}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

clearButton.addEventListener('click', () => {
  contentInput.value = '';
  state.content = '';
  state.templateValues.free = { raw: '' };

  if (state.template !== 'free') {
    state.templateValues[state.template] = {};
    renderTemplateFields();
  }

  renderQrCode();
  contentInput.focus();
});

renderTemplateFields();
renderQrCode();