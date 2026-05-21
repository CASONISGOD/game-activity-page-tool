/* =========================================================
 * 模块定义中心
 *  - meta:  侧边栏展示信息
 *  - data:  默认数据（可被属性面板编辑）
 *  - render(data): 返回模块内部 HTML
 *  - propsSchema: 给属性面板用的字段描述
 * ========================================================= */
const MODULES = {

  /* ---------- 1. Banner 头图 ---------- */
  banner: {
    icon: '🖼️',
    name: 'Banner头图',
    data: () => ({
      title: '王者荣耀\n周年庆典',
      sub: 'ANNIVERSARY CARNIVAL',
      bg: 'https://picsum.photos/seed/game-banner/750/400',
      height: 200
    }),
    render: (d) => `
      <div class="m-banner" style="background-image:url('${escAttr(d.bg)}');height:${num(d.height,200)}px">
        <div>
          <div class="m-banner-title">${escHTML(d.title).replace(/\n/g,'<br/>')}</div>
          <div class="m-banner-sub">${escHTML(d.sub)}</div>
        </div>
      </div>`,
    propsSchema: [
      { key: 'title',  label: '主标题（支持\\n换行）', type: 'textarea' },
      { key: 'sub',    label: '副标题', type: 'text' },
      { key: 'bg',     label: '背景图URL', type: 'image' },
      { key: 'height', label: '高度(px)', type: 'number' }
    ]
  },

  /* ---------- 2. 章节标题 ---------- */
  sectionTitle: {
    icon: '🏷️',
    name: '章节标题',
    data: () => ({ text: '✦ 活动专区 ✦' }),
    render: (d) => `
      <div class="m-section-title">
        <div class="m-section-title-line"></div>
        <div class="m-section-title-text">${escHTML(d.text)}</div>
        <div class="m-section-title-line right"></div>
      </div>`,
    propsSchema: [
      { key: 'text', label: '标题文字', type: 'text' }
    ]
  },

  /* ---------- 3. 倒计时 ---------- */
  countdown: {
    icon: '⏰',
    name: '倒计时',
    data: () => ({ title: '距活动结束还剩', d: '03', h: '12', m: '45', s: '20' }),
    render: (d) => `
      <div class="m-countdown">
        <div class="m-countdown-title">${escHTML(d.title)}</div>
        <div class="m-countdown-time">
          <div><div class="m-countdown-block">${escHTML(d.d)}</div><div class="m-countdown-label">天</div></div>
          <div><div class="m-countdown-block">${escHTML(d.h)}</div><div class="m-countdown-label">时</div></div>
          <div><div class="m-countdown-block">${escHTML(d.m)}</div><div class="m-countdown-label">分</div></div>
          <div><div class="m-countdown-block">${escHTML(d.s)}</div><div class="m-countdown-label">秒</div></div>
        </div>
      </div>`,
    propsSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'd', label: '天', type: 'text' },
      { key: 'h', label: '时', type: 'text' },
      { key: 'm', label: '分', type: 'text' },
      { key: 's', label: '秒', type: 'text' }
    ]
  },

  /* ---------- 4. 签到 ---------- */
  signin: {
    icon: '📅',
    name: '每日签到',
    data: () => ({
      title: '7日签到', badge: '已签3天',
      btn: '立即签到',
      days: [
        { gift:'💎', text:'10钻', signed:true },
        { gift:'🎁', text:'宝箱', signed:true },
        { gift:'⚔️', text:'武器', signed:true },
        { gift:'💰', text:'500币', signed:false },
        { gift:'🏆', text:'称号', signed:false },
        { gift:'🎖️', text:'徽章', signed:false },
        { gift:'👑', text:'皮肤', signed:false }
      ]
    }),
    render: (d) => `
      <div class="m-signin">
        <div class="m-signin-title">${escHTML(d.title)}<span class="badge">${escHTML(d.badge)}</span></div>
        <div class="m-signin-days">
          ${(d.days||[]).map(it=>`
            <div class="m-signin-day ${it.signed?'signed':''}">
              <div class="gift">${escHTML(it.gift)}</div>
              <div class="text">${escHTML(it.text)}</div>
            </div>`).join('')}
        </div>
        <button class="m-signin-btn">${escHTML(d.btn)}</button>
      </div>`,
    propsSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'badge', label: '右上角徽章', type: 'text' },
      { key: 'btn',   label: '按钮文字', type: 'text' },
      { key: 'days',  label: '签到天数', type: 'list', itemFields: [
        { key: 'gift', label: '图标', type: 'text' },
        { key: 'text', label: '文字', type: 'text' },
        { key: 'signed', label: '已签', type: 'bool' }
      ]}
    ]
  },

  /* ---------- 5. 抽奖九宫格 ---------- */
  lottery: {
    icon: '🎰',
    name: '九宫格抽奖',
    data: () => ({
      title: '🎰 幸运大转盘 🎰',
      cells: [
        { icon:'💎', text:'钻石*100' },
        { icon:'🎁', text:'神秘礼包' },
        { icon:'⚔️', text:'橙武碎片' },
        { icon:'💰', text:'金币*1万' },
        { icon:'🎯', text:'立即抽奖' }, // center
        { icon:'🏆', text:'限定皮肤' },
        { icon:'🎖️', text:'纪念徽章' },
        { icon:'👑', text:'王者称号' },
        { icon:'🎫', text:'抽奖券' }
      ]
    }),
    render: (d) => {
      const order = [0,1,2,7,4,3,6,5,8]; // 九宫格顺序：center 在 index 4
      return `
      <div class="m-lottery">
        <div class="m-lottery-title">${escHTML(d.title)}</div>
        <div class="m-lottery-grid">
          ${order.map((i,idx)=>{
            const it = d.cells[i] || {icon:'?',text:''};
            const isCenter = idx === 4;
            return `<div class="m-lottery-cell ${isCenter?'center':''}">
              <div class="icon">${escHTML(it.icon)}</div>
              <div>${escHTML(it.text)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    },
    propsSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'cells', label: '奖品（第5个为中心按钮）', type: 'list', itemFields: [
        { key: 'icon', label: '图标', type: 'text' },
        { key: 'text', label: '文字', type: 'text' }
      ]}
    ]
  },

  /* ---------- 6. 任务列表 ---------- */
  task: {
    icon: '✅',
    name: '任务列表',
    data: () => ({
      title: '每日任务',
      items: [
        { icon:'🎮', name:'登录游戏', reward:'+10钻石', btn:'已完成', done:true },
        { icon:'⚔️', name:'参与3场战斗', reward:'+30钻石', btn:'去完成', done:false },
        { icon:'👥', name:'分享给好友', reward:'+50钻石', btn:'去完成', done:false },
        { icon:'🏅', name:'达成段位', reward:'+礼包', btn:'去完成', done:false }
      ]
    }),
    render: (d) => `
      <div class="m-task">
        <div class="m-task-title">${escHTML(d.title)}</div>
        ${(d.items||[]).map(it=>`
          <div class="m-task-item">
            <div class="m-task-icon">${escHTML(it.icon)}</div>
            <div class="m-task-info">
              <div class="m-task-name">${escHTML(it.name)}</div>
              <div class="m-task-reward">奖励：${escHTML(it.reward)}</div>
            </div>
            <button class="m-task-btn ${it.done?'done':''}">${escHTML(it.btn)}</button>
          </div>`).join('')}
      </div>`,
    propsSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'items', label: '任务项', type: 'list', itemFields: [
        { key: 'icon', label: '图标', type: 'text' },
        { key: 'name', label: '任务名', type: 'text' },
        { key: 'reward', label: '奖励', type: 'text' },
        { key: 'btn', label: '按钮文字', type: 'text' },
        { key: 'done', label: '已完成', type: 'bool' }
      ]}
    ]
  },

  /* ---------- 7. 礼包/兑换 ---------- */
  gift: {
    icon: '🎁',
    name: '礼包兑换',
    data: () => ({
      title: '限时礼包',
      items: [
        { img:'⚔️', name:'战神礼包', price:'¥6', btn:'立即购买' },
        { img:'🛡️', name:'守护礼包', price:'¥30', btn:'立即购买' },
        { img:'👑', name:'王者礼包', price:'¥98', btn:'立即购买' },
        { img:'💎', name:'钻石礼包', price:'¥328', btn:'立即购买' }
      ]
    }),
    render: (d) => `
      <div class="m-gift">
        <div class="m-gift-title">${escHTML(d.title)}</div>
        <div class="m-gift-grid">
          ${(d.items||[]).map(it=>`
            <div class="m-gift-card">
              <div class="m-gift-img">${escHTML(it.img)}</div>
              <div class="m-gift-name">${escHTML(it.name)}</div>
              <div class="m-gift-price">${escHTML(it.price)}</div>
              <button class="m-gift-btn">${escHTML(it.btn)}</button>
            </div>`).join('')}
        </div>
      </div>`,
    propsSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'items', label: '礼包', type: 'list', itemFields: [
        { key: 'img', label: '图标', type: 'text' },
        { key: 'name', label: '名称', type: 'text' },
        { key: 'price', label: '价格', type: 'text' },
        { key: 'btn', label: '按钮文字', type: 'text' }
      ]}
    ]
  },

  /* ---------- 8. 排行榜 ---------- */
  rank: {
    icon: '🏆',
    name: '排行榜',
    data: () => ({
      title: '🏆 战力排行榜',
      items: [
        { name:'无敌大魔王', score:'128,500', avatar:'王' },
        { name:'风之子', score:'118,200', avatar:'风' },
        { name:'孤影', score:'105,800', avatar:'孤' },
        { name:'夜未央', score:'98,300', avatar:'夜' },
        { name:'破军者', score:'87,500', avatar:'破' }
      ]
    }),
    render: (d) => `
      <div class="m-rank">
        <div class="m-rank-title">${escHTML(d.title)}</div>
        <div class="m-rank-list">
          ${(d.items||[]).map((it,i)=>`
            <div class="m-rank-item">
              <div class="m-rank-no ${i<3?'top'+(i+1):''}">${i+1}</div>
              <div class="m-rank-avatar">${escHTML(it.avatar)}</div>
              <div class="m-rank-name">${escHTML(it.name)}</div>
              <div class="m-rank-score">${escHTML(it.score)}</div>
            </div>`).join('')}
        </div>
      </div>`,
    propsSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'items', label: '排名', type: 'list', itemFields: [
        { key: 'name', label: '昵称', type: 'text' },
        { key: 'score', label: '分数', type: 'text' },
        { key: 'avatar', label: '头像文字', type: 'text' }
      ]}
    ]
  },

  /* ---------- 9. 累计进度 / 福利进度 ---------- */
  progress: {
    icon: '📊',
    name: '累充进度',
    data: () => ({
      title: '累计充值', current: '328', target: '1000',
      percent: 33,
      marks: [
        { gift:'🎁', text:'¥100' },
        { gift:'⚔️', text:'¥300' },
        { gift:'👑', text:'¥500' },
        { gift:'💎', text:'¥1000' }
      ]
    }),
    render: (d) => `
      <div class="m-progress">
        <div class="m-progress-title">
          <span>${escHTML(d.title)}</span>
          <span style="color:#ef4444">¥${escHTML(d.current)} / ¥${escHTML(d.target)}</span>
        </div>
        <div class="m-progress-bar">
          <div class="m-progress-fill" style="width:${num(d.percent,0)}%"></div>
        </div>
        <div class="m-progress-marks">
          ${(d.marks||[]).map(m=>`
            <div class="m-progress-mark">
              <span class="gift">${escHTML(m.gift)}</span>
              ${escHTML(m.text)}
            </div>`).join('')}
        </div>
      </div>`,
    propsSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'current', label: '当前值', type: 'text' },
      { key: 'target', label: '目标值', type: 'text' },
      { key: 'percent', label: '进度%(0-100)', type: 'number' },
      { key: 'marks', label: '里程碑', type: 'list', itemFields: [
        { key: 'gift', label: '图标', type: 'text' },
        { key: 'text', label: '文字', type: 'text' }
      ]}
    ]
  },

  /* ---------- 10. 充值档位 ---------- */
  recharge: {
    icon: '💰',
    name: '充值档位',
    data: () => ({
      title: '首充翻倍',
      items: [
        { amount:'¥6',   bonus:'+60钻', btn:'购买', hot:false },
        { amount:'¥30',  bonus:'+330钻', btn:'购买', hot:true  },
        { amount:'¥98',  bonus:'+1100钻', btn:'购买', hot:false },
        { amount:'¥198', bonus:'+2300钻', btn:'购买', hot:false },
        { amount:'¥328', bonus:'+3800钻', btn:'购买', hot:false },
        { amount:'¥648', bonus:'+7600钻', btn:'购买', hot:true  }
      ]
    }),
    render: (d) => `
      <div class="m-recharge">
        <div class="m-recharge-title">${escHTML(d.title)}</div>
        <div class="m-recharge-list">
          ${(d.items||[]).map(it=>`
            <div class="m-recharge-item ${it.hot?'hot':''}">
              <div class="m-recharge-amount">${escHTML(it.amount)}</div>
              <div class="m-recharge-bonus">${escHTML(it.bonus)}</div>
              <button class="m-recharge-btn">${escHTML(it.btn)}</button>
            </div>`).join('')}
        </div>
      </div>`,
    propsSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'items', label: '档位', type: 'list', itemFields: [
        { key: 'amount', label: '金额', type: 'text' },
        { key: 'bonus', label: '赠送', type: 'text' },
        { key: 'btn', label: '按钮', type: 'text' },
        { key: 'hot', label: 'HOT', type: 'bool' }
      ]}
    ]
  },

  /* ---------- 11. 规则说明 ---------- */
  rules: {
    icon: '📜',
    name: '活动规则',
    data: () => ({
      title: '活动规则',
      text: '1. 活动时间：2026/04/20 - 2026/05/05\n2. 活动期间每日均可参与签到与抽奖\n3. 所有奖励发放至游戏内邮箱，请注意查收\n4. 活动最终解释权归运营方所有'
    }),
    render: (d) => `
      <div class="m-rules">
        <div class="m-rules-title">📜 ${escHTML(d.title)}</div>
        <div class="m-rules-text">${escHTML(d.text)}</div>
      </div>`,
    propsSchema: [
      { key: 'title', label: '标题', type: 'text' },
      { key: 'text', label: '规则正文', type: 'textarea' }
    ]
  },

  /* ---------- 12. 按钮组 ---------- */
  buttons: {
    icon: '🔘',
    name: '按钮组',
    data: () => ({ left: '前往游戏', right: '邀请好友', warnRight: true }),
    render: (d) => `
      <div class="m-buttons">
        <button class="m-btn">${escHTML(d.left)}</button>
        <button class="m-btn ${d.warnRight?'warn':''}">${escHTML(d.right)}</button>
      </div>`,
    propsSchema: [
      { key: 'left', label: '左按钮', type: 'text' },
      { key: 'right', label: '右按钮', type: 'text' },
      { key: 'warnRight', label: '右按钮高亮', type: 'bool' }
    ]
  },

  /* ---------- 13. 文本块 ---------- */
  text: {
    icon: '📝',
    name: '文本块',
    data: () => ({ text: '在这里输入活动文案，例如活动亮点、福利说明等', size: 14, color: '#ffffff' }),
    render: (d) => `
      <div class="m-text" style="font-size:${num(d.size,14)}px;color:${escAttr(d.color)}">
        ${escHTML(d.text).replace(/\n/g,'<br/>')}
      </div>`,
    propsSchema: [
      { key: 'text', label: '文本内容', type: 'textarea' },
      { key: 'size', label: '字号(px)', type: 'number' },
      { key: 'color', label: '颜色', type: 'color' }
    ]
  },

  /* ---------- 14. 图片 ---------- */
  image: {
    icon: '🌅',
    name: '图片',
    data: () => ({ src: '' }),
    render: (d) => `
      <div class="m-image">
        ${d.src
          ? `<img src="${escAttr(d.src)}" alt="image"/>`
          : `<div class="placeholder">点击右侧属性面板，输入图片URL或上传图片</div>`}
      </div>`,
    propsSchema: [
      { key: 'src', label: '图片URL或上传', type: 'image' }
    ]
  },

  /* ---------- 15. 间距 ---------- */
  spacer: {
    icon: '➖',
    name: '间距',
    data: () => ({ height: 20 }),
    render: (d) => `<div class="m-spacer" style="height:${num(d.height,20)}px"></div>`,
    propsSchema: [
      { key: 'height', label: '高度(px)', type: 'number' }
    ]
  }

};

/* ============== 工具函数 ============== */
function escHTML(s) {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escAttr(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function num(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
