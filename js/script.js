/* ============================================================
   QxBit Studio — 交互与动画层
   ============================================================ */

(function () {
  'use strict';

  // ── Intersection Observer：滚动触发淡入 ──
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  // 观察静态元素
  document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
  document.querySelectorAll('.work-card').forEach((el) => observer.observe(el));

  // ── 从 Data/config.json 渲染作品卡片 ──
  const worksGrid = document.getElementById('worksGrid');
  const cardTemplate = document.getElementById('workCardTemplate');

  function renderCards(projects) {
    if (!worksGrid || !cardTemplate) return;
    projects.forEach((proj, i) => {
      const clone = cardTemplate.content.cloneNode(true);
      const card = clone.querySelector('.work-card');
      const overlay = clone.querySelector('.work-overlay');
      const tag = clone.querySelector('.work-tag');
      const img = clone.querySelector('.work-img');
      img.src = proj.imagePath;
      img.alt = proj.name;
      tag.textContent = proj.tag;
      clone.querySelector('.work-name').textContent = proj.name;
      clone.querySelector('.work-desc').textContent = proj.desc;
      if (proj.wide) {
        card.classList.add('work-card--wide');
        overlay.classList.add('work-overlay--frost');
        tag.classList.add('work-tag--light');
      }
      card.style.transitionDelay = `${0.1 * (i + 1)}s`;
      worksGrid.appendChild(clone);
      observer.observe(card);
    });
  }

  // ── 从 Data/config.json 渲染服务项 ──
  const servicesList = document.getElementById('servicesList');
  const serviceTemplate = document.getElementById('serviceItemTemplate');

  function renderServices(items) {
    if (!servicesList || !serviceTemplate) return;
    items.forEach((svc, i) => {
      const clone = serviceTemplate.content.cloneNode(true);
      const el = clone.querySelector('.service-item');
      el.classList.add(i % 2 === 0 ? 'service-item--dark' : 'service-item--light');
      el.querySelector('.service-num').textContent = String(i + 1).padStart(2, '0');
      el.querySelector('.service-name').textContent = svc.name;
      el.querySelector('.service-desc').textContent = svc.desc;
      const ul = el.querySelector('.service-details');
      svc.details.forEach((d) => {
        const li = document.createElement('li');
        li.textContent = d;
        ul.appendChild(li);
      });
      servicesList.appendChild(el);
      observer.observe(el);
    });
  }

  // ── 图标 SVG 映射表 ──
  const iconMap = {
    GitHub: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.604-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>',
    Blog: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 20h9"/><path fill="none" stroke="currentColor" stroke-width="1.8" d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    X: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    Bilibili: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.396.786 1.894.507.497 1.134.755 1.88.773h13.334c.746-.018 1.373-.276 1.88-.773.506-.498.769-1.13.786-1.894v-7.52c-.017-.764-.28-1.396-.786-1.893-.507-.498-1.134-.756-1.88-.774zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/></svg>'
  };

  // ── 从配置绑定首屏文字 ──
  function bindHero(h) {
    if (!h) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('heroKicker', h.kicker);
    set('heroTitle', h.title);
    set('heroSub', h.sub);
    set('footerBrand', h.title);
    set('footerCopyright', `© 2026 ${h.title}`);
    document.title = `${h.title} — ${h.sub}`;

    // 用打字机效果循环标语
    const taglines = Array.isArray(h.tagline) ? h.tagline : [h.tagline];
    const tagEl = document.getElementById('heroTagline');
    const cursor = document.getElementById('taglineCursor');
    const footerTag = document.getElementById('footerTagline');
    if (!tagEl || taglines.length === 0) return;

    let listIdx = 0;
    let charIdx = 0;
    let deleting = false;
    if (cursor) cursor.style.display = 'inline-block';

    function tick() {
      const current = taglines[listIdx];

      if (!deleting) {
        // 向前输入
        if (charIdx < current.length) {
          tagEl.textContent += current[charIdx];
          charIdx++;
          setTimeout(tick, 50 + Math.random() * 40);
        } else {
          // 完整文本后暂停，然后开始删除
          if (footerTag) footerTag.textContent = `> ${current}`;
          setTimeout(() => { deleting = true; tick(); }, 2000);
        }
      } else {
        // 向后删除
        if (charIdx > 0) {
          tagEl.textContent = current.slice(0, charIdx - 1);
          charIdx--;
          setTimeout(tick, 25 + Math.random() * 20);
        } else {
          // 切换到下一条标语
          deleting = false;
          listIdx = (listIdx + 1) % taglines.length;
          setTimeout(tick, 300);
        }
      }
    }

    setTimeout(tick, 400);
  }

  // ── 从配置绑定外部链接 ──
  function bindLinks(info) {
    if (!info) return;
    document.querySelectorAll('[data-link]').forEach((el) => {
      const key = el.getAttribute('data-link');
      const url = info[key];
      if (!url || typeof url !== 'string') return;
      el.setAttribute('href', key === 'email' ? `mailto:${url}` : url);
    });
  }

  // ── 从 Data/config.json 渲染社交图标 ──
  const socialIcons = document.getElementById('socialIcons');

  function renderSocial(platforms) {
    if (!socialIcons) return;
    socialIcons.innerHTML = '';
    platforms.forEach((p) => {
      const svg = iconMap[p.name];
      if (!svg) return;
      const a = document.createElement('a');
      a.href = p.url;
      a.className = 'social-icon';
      a.setAttribute('aria-label', p.name);
      a.target = '_blank';
      a.relList.add('noopener');
      a.innerHTML = svg;
      socialIcons.appendChild(a);
    });
  }

  fetch('./Data/config.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      bindHero(data.info.hero);
      bindLinks(data.info);
      renderCards(data.portfolio);
      renderServices(data.services);
      renderSocial(data.social);
    })
    .catch(() => {
      renderCards([
        { tag: '开源产品', name: 'QingBlog', desc: '基于 GitHub Issues 的轻量静态博客框架，无需服务器即可发布文章。', imagePath: 'qingblog' },
        { tag: 'CLI 工具', name: 'QxToolBox', desc: '面向开发者的命令行效率工具箱，Node.js 实现。', imagePath: 'clitool' },
        { tag: '开源作品集', name: '更多项目与实验', desc: 'GitHub 上持续发布前端工具、静态站点生成器、CLI 应用及技术文章。关注以获得最新动态。', imagePath: 'clitool', wide: true }
      ]);
      renderServices([
        { name: '前端工程', desc: '以原生 HTML/CSS/JS 为基底，不依赖重型框架，交付精确、可维护的前端实现。', details: ['Web 应用与交互界面', '响应式设计与无障碍', '性能审计与优化'] },
        { name: '静态站点 & 工具链', desc: '自建静态站点生成器，熟悉从 Markdown 编译到 CI/CD 部署的完整链路。', details: ['静态站点生成器开发', 'Markdown 渲染管线', 'CI/CD 自动化部署'] },
        { name: 'CLI 应用开发', desc: '用 Node.js 构建命令行工具，关注交互体验、输出格式与跨平台兼容。', details: ['Node.js CLI 框架', '终端交互与配色', '跨平台构建与分发'] },
        { name: '技术写作', desc: '将技术决策与实现细节转化为清晰文档。博客、教程、项目 README。', details: ['技术博客与深度文章', '开源项目文档', '知识体系构建'] }
      ]);
    });

  // ── 导航链接活跃状态追踪 ──
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    let currentId = '';
    const scrollTop = window.scrollY + 120; // 导航栏高度偏移

    sections.forEach((section) => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;
      if (scrollTop >= top && scrollTop < bottom) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      // 跳过外部链接
      if (!href || !href.startsWith('#')) return;
      if (href === '#' + currentId) {
        link.classList.add('nav-link--active');
      } else {
        link.classList.remove('nav-link--active');
      }
    });
  }

  // ── 滚动时导航栏背景透明度 ──
  const nav = document.getElementById('nav');

  function updateNavOpacity() {
    if (window.scrollY > 60) {
      nav.style.background = 'rgba(10, 10, 10, 0.94)';
    } else {
      nav.style.background = 'rgba(10, 10, 10, 0.82)';
    }
  }

  // ── 合并滚动处理（节流）──
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveLink();
        updateNavOpacity();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ── 初始状态 ──
  updateActiveLink();
  updateNavOpacity();

  // ── 加载时立即显示首屏元素 ──
  window.addEventListener('load', () => {
    // 小延迟以确保 CSS 过渡生效
    requestAnimationFrame(() => {
      document.querySelectorAll('.hero .fade-up').forEach((el) => {
        el.classList.add('visible');
      });
    });
  });
})();
