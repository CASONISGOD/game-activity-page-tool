/* =========================================================
 * 主应用逻辑：
 *  - 渲染左侧模块库
 *  - 拖拽到画布、画布内排序
 *  - 模块选中、属性编辑、复制、删除
 *  - 主题切换、画布宽度、手机外壳
 *  - 预览、清空、JSON 导出/导入、长图导出
 * ========================================================= */
(function () {
  'use strict';

  // ---------- 状态 ----------
  const state = {
    blocks: [],          // [{ id, type, data }]
    selectedId: null,
    theme: 'cyber',
    canvasWidth: 750,
    phoneFrame: false
  };

  // ---------- DOM 引用 ----------
  const $ = (sel) => document.querySelector(sel);
  const moduleListEl = $('#moduleList');
  const canvasEl = $('#canvas');
  const phoneFrameEl = $('#phoneFrame');
  const propsContentEl = $('#propsContent');

  // ---------- 初始化 ----------
  function init() {
    renderModuleList();
    bindCanvasDrop();
    bindTopbar();
    setCanvasWidth(state.canvasWidth);
    renderCanvas();
  }

  // ============================================================
  // 一、左侧模块库
  // ============================================================
  function renderModuleList() {
    const html = Object.entries(MODULES).map(([type, m]) => `
      <div class="module-card" draggable="true" data-type="${type}">
        <div class="module-icon">${m.icon}</div>
        <div class="module-name">${m.name}</div>
      </div>`).join('');
    moduleListEl.innerHTML = html;

    moduleListEl.querySelectorAll('.module-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/module-type', card.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
      });
    });
  }

  // ============================================================
  // 二、拖拽到画布
  // ============================================================
  function bindCanvasDrop() {
    canvasEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      // 仅当 dataTransfer 中有 module-type 或 sort-id 时显示
      canvasEl.classList.add('drag-over');
      // 显示插入指示器
      showDropIndicator(e.clientY);
    });

    canvasEl.addEventListener('dragleave', (e) => {
      // 如果离开整个画布
      if (!canvasEl.contains(e.relatedTarget)) {
        canvasEl.classList.remove('drag-over');
        clearDropIndicator();
      }
    });

    canvasEl.addEventListener('drop', (e) => {
      e.preventDefault();
      canvasEl.classList.remove('drag-over');
      clearDropIndicator();

      const type = e.dataTransfer.getData('text/module-type');
      const sortId = e.dataTransfer.getData('text/sort-id');
      const insertIndex = computeInsertIndex(e.clientY);

      if (type && MODULES[type]) {
        // 新增模块
        const block = {
          id: 'b_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          type,
          data: MODULES[type].data()
        };
        state.blocks.splice(insertIndex, 0, block);
        state.selectedId = block.id;
        renderCanvas();
      } else if (sortId) {
        // 排序
        const fromIdx = state.blocks.findIndex(b => b.id === sortId);
        if (fromIdx === -1) return;
        let toIdx = insertIndex;
        if (toIdx > fromIdx) toIdx -= 1; // 向下移动需修正
        if (fromIdx === toIdx) return;
        const [moved] = state.blocks.splice(fromIdx, 1);
        state.blocks.splice(toIdx, 0, moved);
        renderCanvas();
      }
    });

    // 点击空白取消选中
    canvasEl.addEventListener('click', (e) => {
      if (e.target === canvasEl || e.target.classList.contains('empty-tip')) {
        state.selectedId = null;
        renderCanvas();
      }
    });
  }

  let dropIndicatorEl = null;
  function showDropIndicator(clientY) {
    clearDropIndicator();
    const idx = computeInsertIndex(clientY);
    dropIndicatorEl = document.createElement('div');
    dropIndicatorEl.className = 'drop-indicator';
    const modules = canvasEl.querySelectorAll('.module');
    if (idx >= modules.length) {
      canvasEl.appendChild(dropIndicatorEl);
    } else {
      canvasEl.insertBefore(dropIndicatorEl, modules[idx]);
    }
  }
  function clearDropIndicator() {
    if (dropIndicatorEl && dropIndicatorEl.parentNode) {
      dropIndicatorEl.parentNode.removeChild(dropIndicatorEl);
    }
    dropIndicatorEl = null;
  }
  function computeInsertIndex(clientY) {
    const modules = Array.from(canvasEl.querySelectorAll('.module'));
    for (let i = 0; i < modules.length; i++) {
      const rect = modules[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return i;
    }
    return modules.length;
  }

  // ============================================================
  // 三、画布渲染
  // ============================================================
  function renderCanvas() {
    if (state.blocks.length === 0) {
      canvasEl.dataset.empty = 'true';
      canvasEl.innerHTML = `
        <div class="empty-tip">
          <div class="empty-icon">✨</div>
          <div>从左侧拖拽模块到此处<br/>开始搭建你的活动页</div>
        </div>`;
      renderProps(null);
      return;
    }

    canvasEl.dataset.empty = 'false';
    canvasEl.innerHTML = state.blocks.map(b => {
      const mod = MODULES[b.type];
      if (!mod) return '';
      const inner = mod.render(b.data);
      const sel = b.id === state.selectedId ? 'selected' : '';
      return `
        <div class="module ${sel}" data-id="${b.id}" draggable="true">
          <div class="module-toolbar">
            <button data-act="up"   title="上移">↑</button>
            <button data-act="down" title="下移">↓</button>
            <button data-act="copy" title="复制">⧉</button>
            <button data-act="del"  class="danger" title="删除">✕</button>
          </div>
          <div class="module-content">${inner}</div>
        </div>`;
    }).join('');

    bindModuleEvents();
    renderProps(state.selectedId);
  }

  function bindModuleEvents() {
    canvasEl.querySelectorAll('.module').forEach(el => {
      const id = el.dataset.id;

      // 点击选中
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        state.selectedId = id;
        // 局部刷新选中态，避免重渲染整页
        canvasEl.querySelectorAll('.module').forEach(m => m.classList.remove('selected'));
        el.classList.add('selected');
        renderProps(id);
      });

      // 工具栏按钮
      el.querySelectorAll('.module-toolbar button').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const act = btn.dataset.act;
          handleAction(id, act);
        });
      });

      // 模块拖拽（排序）
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/sort-id', id);
        e.dataTransfer.effectAllowed = 'move';
        // 避免被外层吞掉：阻止内置浏览器图层的副作用
        setTimeout(() => el.style.opacity = '0.4', 0);
      });
      el.addEventListener('dragend', () => {
        el.style.opacity = '';
      });
    });
  }

  function handleAction(id, act) {
    const idx = state.blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    if (act === 'up' && idx > 0) {
      [state.blocks[idx-1], state.blocks[idx]] = [state.blocks[idx], state.blocks[idx-1]];
    } else if (act === 'down' && idx < state.blocks.length - 1) {
      [state.blocks[idx+1], state.blocks[idx]] = [state.blocks[idx], state.blocks[idx+1]];
    } else if (act === 'copy') {
      const src = state.blocks[idx];
      const clone = {
        id: 'b_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
        type: src.type,
        data: JSON.parse(JSON.stringify(src.data))
      };
      state.blocks.splice(idx + 1, 0, clone);
      state.selectedId = clone.id;
    } else if (act === 'del') {
      state.blocks.splice(idx, 1);
      if (state.selectedId === id) state.selectedId = null;
    }
    renderCanvas();
  }

  // ============================================================
  // 四、属性面板
  // ============================================================
  function renderProps(id) {
    if (!id) {
      propsContentEl.innerHTML = `<div class="props-empty">点击画布中的模块进行编辑</div>`;
      return;
    }
    const block = state.blocks.find(b => b.id === id);
    if (!block) return;
    const mod = MODULES[block.type];
    if (!mod) return;

    let html = `<div class="props-section">${mod.icon} ${mod.name}</div>`;
    mod.propsSchema.forEach(field => {
      html += renderField(field, block.data[field.key], field.key);
    });
    propsContentEl.innerHTML = html;

    bindPropEvents(block, mod);
  }

  function renderField(field, value, path) {
    const lab = `<label class="prop-label">${escapeHTML(field.label)}</label>`;
    if (field.type === 'text') {
      return `<div class="prop-group">${lab}
        <input class="prop-input" type="text" data-path="${path}" value="${escapeAttr(value || '')}"/></div>`;
    }
    if (field.type === 'textarea') {
      return `<div class="prop-group">${lab}
        <textarea class="prop-textarea" data-path="${path}">${escapeHTML(value || '')}</textarea></div>`;
    }
    if (field.type === 'number') {
      return `<div class="prop-group">${lab}
        <input class="prop-input" type="number" data-path="${path}" value="${escapeAttr(value)}"/></div>`;
    }
    if (field.type === 'color') {
      return `<div class="prop-group">${lab}
        <input class="prop-color" type="color" data-path="${path}" value="${escapeAttr(value || '#ffffff')}"/></div>`;
    }
    if (field.type === 'bool') {
      return `<div class="prop-group">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#d4d7e6;cursor:pointer">
          <input type="checkbox" data-path="${path}" ${value?'checked':''}/>
          ${escapeHTML(field.label)}
        </label></div>`;
    }
    if (field.type === 'image') {
      return `<div class="prop-group">${lab}
        <input class="prop-input" type="text" data-path="${path}" value="${escapeAttr(value || '')}" placeholder="https:// 或留空"/>
        <div style="margin-top:6px">
          <input type="file" accept="image/*" class="prop-file" data-path="${path}" style="font-size:11px;color:#8b8fa5"/>
        </div></div>`;
    }
    if (field.type === 'list') {
      const items = Array.isArray(value) ? value : [];
      let listHTML = `<div class="prop-group">${lab}`;
      items.forEach((item, i) => {
        listHTML += `<div class="prop-list-item" data-list="${path}" data-index="${i}">`;
        field.itemFields.forEach(f => {
          if (f.type === 'bool') {
            listHTML += `<div class="row">
              <label style="font-size:11px;color:#b6bad0;display:flex;align-items:center;gap:4px;cursor:pointer">
                <input type="checkbox" data-list-field="${f.key}" ${item[f.key]?'checked':''}/>${escapeHTML(f.label)}
              </label></div>`;
          } else {
            listHTML += `<div class="row">
              <span style="font-size:10px;color:#8b8fa5;min-width:36px">${escapeHTML(f.label)}</span>
              <input class="prop-input" data-list-field="${f.key}" value="${escapeAttr(item[f.key]||'')}"/>
            </div>`;
          }
        });
        listHTML += `<div class="row" style="justify-content:flex-end">
          <button class="prop-del-btn" data-list-del>删除</button>
        </div></div>`;
      });
      listHTML += `<button class="prop-add-btn" data-list-add="${path}">+ 添加一项</button></div>`;
      return listHTML;
    }
    return '';
  }

  function bindPropEvents(block, mod) {
    // 文本/数字/颜色/勾选
    propsContentEl.querySelectorAll('[data-path]').forEach(input => {
      const path = input.dataset.path;
      const handler = () => {
        let v;
        if (input.type === 'checkbox') v = input.checked;
        else if (input.type === 'number') v = Number(input.value);
        else v = input.value;
        block.data[path] = v;
        // 局部更新此模块 DOM
        updateBlockDOM(block);
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    // 文件上传
    propsContentEl.querySelectorAll('.prop-file').forEach(file => {
      file.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          const path = file.dataset.path;
          block.data[path] = reader.result;
          // 同步到对应文本输入
          const txt = propsContentEl.querySelector(`input[type="text"][data-path="${path}"]`);
          if (txt) txt.value = reader.result.length > 80 ? '[已上传图片]' : reader.result;
          updateBlockDOM(block);
        };
        reader.readAsDataURL(f);
      });
    });

    // 列表项编辑
    propsContentEl.querySelectorAll('.prop-list-item').forEach(itemEl => {
      const listKey = itemEl.dataset.list;
      const idx = Number(itemEl.dataset.index);
      itemEl.querySelectorAll('[data-list-field]').forEach(field => {
        const k = field.dataset.listField;
        const handler = () => {
          let v;
          if (field.type === 'checkbox') v = field.checked;
          else v = field.value;
          if (!Array.isArray(block.data[listKey])) block.data[listKey] = [];
          block.data[listKey][idx][k] = v;
          updateBlockDOM(block);
        };
        field.addEventListener('input', handler);
        field.addEventListener('change', handler);
      });
      // 删除
      const delBtn = itemEl.querySelector('[data-list-del]');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          block.data[listKey].splice(idx, 1);
          renderProps(block.id);
          updateBlockDOM(block);
        });
      }
    });

    // 列表添加
    propsContentEl.querySelectorAll('[data-list-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const listKey = btn.dataset.listAdd;
        const field = mod.propsSchema.find(f => f.key === listKey);
        const newItem = {};
        (field.itemFields || []).forEach(f => {
          newItem[f.key] = f.type === 'bool' ? false : '';
        });
        if (!Array.isArray(block.data[listKey])) block.data[listKey] = [];
        block.data[listKey].push(newItem);
        renderProps(block.id);
        updateBlockDOM(block);
      });
    });
  }

  function updateBlockDOM(block) {
    const el = canvasEl.querySelector(`.module[data-id="${block.id}"] .module-content`);
    if (!el) return;
    const mod = MODULES[block.type];
    el.innerHTML = mod.render(block.data);
  }

  // ============================================================
  // 五、顶部工具栏
  // ============================================================
  function bindTopbar() {
    // 主题
    $('#themeSelect').addEventListener('change', (e) => {
      state.theme = e.target.value;
      applyTheme();
    });
    // 画布宽度
    $('#canvasWidth').addEventListener('change', (e) => {
      setCanvasWidth(Number(e.target.value));
    });
    // 手机外壳
    $('#phoneFrameToggle').addEventListener('change', (e) => {
      state.phoneFrame = e.target.checked;
      phoneFrameEl.classList.toggle('with-frame', state.phoneFrame);
      canvasEl.classList.toggle('with-radius', state.phoneFrame);
    });
    // 清空
    $('#clearBtn').addEventListener('click', () => {
      if (state.blocks.length === 0) return;
      if (confirm('确定要清空画布吗？此操作不可撤销。')) {
        state.blocks = [];
        state.selectedId = null;
        renderCanvas();
      }
    });
    // 预览
    $('#previewBtn').addEventListener('click', showPreview);
    $('#previewClose').addEventListener('click', hidePreview);
    // 保存 JSON
    $('#exportJsonBtn').addEventListener('click', exportJSON);
    // 导入 JSON
    $('#importJsonBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', importJSON);
    // 导出图片
    $('#exportImgBtn').addEventListener('click', exportImage);

    applyTheme();
  }

  function applyTheme() {
    canvasEl.className = canvasEl.className
      .split(' ').filter(c => !c.startsWith('theme-')).join(' ');
    canvasEl.classList.add('theme-' + state.theme);
  }

  function setCanvasWidth(w) {
    state.canvasWidth = w;
    // 缩放：在 240+260 = 500 旁边的画布区如果宽不够，用 transform scale；这里直接给宽度，让外层滚动
    phoneFrameEl.style.setProperty('--canvas-w', w + 'px');
  }

  // ============================================================
  // 六、预览 / JSON / 导出
  // ============================================================
  function showPreview() {
    const mask = $('#previewMask');
    const content = $('#previewContent');
    // 克隆当前画布（不带选中态、不带工具栏）
    const clone = canvasEl.cloneNode(true);
    clone.querySelectorAll('.module').forEach(m => m.classList.remove('selected'));
    clone.querySelectorAll('.module-toolbar').forEach(t => t.remove());
    clone.style.width = state.canvasWidth + 'px';
    clone.style.maxWidth = '100%';
    clone.style.margin = '0 auto';
    content.innerHTML = '';
    content.appendChild(clone);
    mask.classList.add('show');
  }
  function hidePreview() { $('#previewMask').classList.remove('show'); }

  function exportJSON() {
    const data = {
      version: 1,
      theme: state.theme,
      canvasWidth: state.canvasWidth,
      phoneFrame: state.phoneFrame,
      blocks: state.blocks
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.blocks)) throw new Error('JSON格式错误');
        state.blocks = data.blocks;
        state.selectedId = null;
        if (data.theme) {
          state.theme = data.theme;
          $('#themeSelect').value = data.theme;
        }
        if (data.canvasWidth) {
          setCanvasWidth(data.canvasWidth);
          $('#canvasWidth').value = String(data.canvasWidth);
        }
        if (typeof data.phoneFrame === 'boolean') {
          state.phoneFrame = data.phoneFrame;
          $('#phoneFrameToggle').checked = data.phoneFrame;
          phoneFrameEl.classList.toggle('with-frame', data.phoneFrame);
          canvasEl.classList.toggle('with-radius', data.phoneFrame);
        }
        applyTheme();
        renderCanvas();
      } catch (err) {
        alert('导入失败：' + err.message);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(f);
  }

  function exportImage() {
    if (state.blocks.length === 0) {
      alert('画布为空，请先拖入模块');
      return;
    }
    const mask = $('#loadingMask');
    const text = $('#loadingText');
    mask.classList.add('show');
    text.textContent = '正在生成图片…';

    // 临时取消选中态，避免外框出现在图中
    const prevSel = state.selectedId;
    state.selectedId = null;
    renderCanvas();

    // 等待一帧让 DOM 重绘
    requestAnimationFrame(() => {
      html2canvas(canvasEl, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
        logging: false
      }).then(canvas => {
        canvas.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `activity-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          mask.classList.remove('show');
          // 恢复选中
          state.selectedId = prevSel;
          renderCanvas();
        }, 'image/png');
      }).catch(err => {
        mask.classList.remove('show');
        state.selectedId = prevSel;
        renderCanvas();
        alert('导出失败：' + err.message + '\n\n如使用了外链图片，可能因跨域被拦截，请尝试上传本地图片。');
      });
    });
  }

  // ---------- 工具 ----------
  function escapeHTML(s) {
    if (s === undefined || s === null) return '';
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function escapeAttr(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // 启动
  document.addEventListener('DOMContentLoaded', init);
})();
