// 主题设置
const themes = {
  dark: {
    '--primary-color': '#388bff',
    '--text-color': 'rgba(255, 255, 255, 1)',
    '--text-shadow-color': 'rgba(32, 67, 80, 1)',
    '--text-secondary-color': 'rgba(161, 161, 161, 1)',
    '--bg-color': 'linear-gradient(180deg, rgba(10, 18, 28, 1), rgba(11, 21, 26, 1), rgba(8, 16, 24, 1), rgba(4, 7, 12, 1))',
    '--hero-bg-color': 'rgba(8, 16, 24, 1)',
    '--surface-color': 'linear-gradient(rgba(25, 45, 55, 0.4), transparent)',
    '--surface-border-color': 'rgba(245, 245, 245, 0.1)',
    '--border-color': 'rgba(245, 245, 245, 0.1)',
    '--box-shadow-color': 'rgba(0, 0, 0, 0.4)',
    '--divider-color': 'rgba(255, 255, 255, 0.3)',
    '--backdrop-blur': 'blur(0.7em)',
  },
  light: {
    '--primary-color': '#388bff',
    '--text-color': 'rgba(44, 44, 44, 1)',
    '--text-shadow-color': 'rgba(144, 144, 144, 1)',
    '--text-secondary-color': 'rgba(85, 85, 85, 1)',
    '--bg-color': 'linear-gradient(180deg, rgba(235, 236, 238, 1), rgba(228, 229, 231, 1), rgba(217, 218, 220, 1), rgba(208, 209, 211, 1))',
    '--hero-bg-color': 'rgba(217, 218, 220, 1)',
    '--surface-color': 'linear-gradient(rgba(240, 240, 240, 0.4), transparent)',
    '--surface-border-color': 'rgba(255, 255, 255, 0.1)',
    '--border-color': 'rgba(255, 255, 255, 0.1)',
    '--box-shadow-color': 'rgba(0, 0, 0, 0.2)',
    '--divider-color': 'rgba(0, 0, 0, 0.3)',
    '--backdrop-blur': 'blur(0.7em)',
  },
}

// 标题切换
function initWebTitle() {
  const webTitleTextList = [
    "QingBlog - QingXuanJun的个人博客 💻",
    "QingBlog - 欢迎来到QingXuanJun的个人博客哦~ 🎉",
    "QingBlog - 欢迎来到一位技术宅的Blog 🤓",
    "QingBlog - 这里是QingXuanJun独一无二的小站哦！⭐",
    "QingBlog - 代码、生活与碎碎念 ✨📝",
    "QingBlog - 一个喜欢折腾的极客空间 🛠️⚡",
    "QingBlog - 记录成长，分享热爱 📖❤️",
    "QingBlog - 在0和1的世界里寻找浪漫 💾🌹",
    "QingBlog - 今日份灵感已加载完毕 🚀💡",
    "QingBlog - 探索技术，也探索生活 🔍🌿"
  ];

  const webTitleLeaveList = [
    "QingBlog - (｡•́︿•̀｡) 你怎么走掉了啦~",
    "QingBlog - 哼！再不回来看我就不理你了！💢",
    "QingBlog - 快回来嘛，我一个人好无聊QAQ 🥺",
    "QingBlog - 去忙吧，记得回来看看我哦 👋💕",
    "QingBlog - while(true) { await you.comeBack(); } ⏳",
    "QingBlog - console.log('用户离开了，悲伤.jpg') 😭",
    "QingBlog - 404 Not Found: 用户已离线 🔌",
    "QingBlog - // TODO: 用户快回来继续逛博客 📝",
    "QingBlog - 无论你走多远，这里永远亮着灯 💡🏠",
    "QingBlog - 累了就回来歇歇脚吧~ ☕🛋️"
  ];

  const webTitleWelcomeBackList = [
    "QingBlog - 你终于回来啦！✨",
    "QingBlog - 欢迎回来！等你好久了~ 🎉",
    "QingBlog - 呀！你回来啦！(◕‿◕)♡",
    "QingBlog - 好久不见，甚是想念！💕",
    "QingBlog - 哼，还知道回来呀~ 😤",
    "QingBlog - 你去哪儿玩了，不带我！🥺",
    "QingBlog - 欢迎回家！我乖不乖~ 🐱",
    "QingBlog - 你不在的时候我有好好看家哦！⭐",
    "QingBlog - 200 OK: 用户已回归 🟢",
    "QingBlog - console.log('用户回来了，开心！')",
    "QingBlog - await user.comeBack() // resolved ✓",
    "QingBlog - git pull origin user-back 🎊",
    "QingBlog - 回来就好，休息一下吧~ ☕",
    "QingBlog - 这里永远为你亮着灯 💡",
    "QingBlog - 欢迎回来，继续我们的故事 📖",
    "QingBlog - 累了就歇会儿，我陪你 🛋️"
  ];

  const webTitleSwitchIntervalSec = 5000;

  document.title = webTitleTextList[0];

  let webTitleSwitchIntervalId;
  function webTitleSwitch(list) {
    clearInterval(webTitleSwitchIntervalId);

    const listLength = list.length;
    document.title = list[Math.floor(Math.random() * listLength)];

    webTitleSwitchIntervalId = setInterval(function () {
      const random = Math.floor(Math.random() * listLength);
      document.title = list[random];
    }, webTitleSwitchIntervalSec);
  }

  // 监听页面可见性变化
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      webTitleSwitch(webTitleLeaveList);
    } else {
      webTitleSwitch(webTitleWelcomeBackList);
      setTimeout(function () {
        webTitleSwitch(webTitleTextList);
      }, webTitleSwitchIntervalSec);
    }
  });

  webTitleSwitch(webTitleTextList);
}

// -------------------------------------------------------------

// 弹窗相关功能
function alertAnimation() {
  const alertMessage = document.getElementById("alert-message");

  if (!alertMessage) return;

  alertMessage.style.animation = "none";
  alertMessage.offsetHeight;
  alertMessage.style.animation = "alertAnimation 2.2s normal forwards";
}

function showAlert(color, message) {
  const alertMessage = document.getElementById("alert-message");

  if (!alertMessage) return;

  alertMessage.querySelector("span").innerHTML = message;

  if (color === "green") {
    alertMessage.style.background = "rgba(34, 197, 94, 0.3)";
    alertMessage.style.border = "1px solid rgba(34, 197, 94, 0.4)";
    alertMessage.style.boxShadow = "0 0 20px rgba(34, 197, 94, 0.2), inset 0 0 10px rgba(34, 197, 94, 0.05)";
    alertAnimation();
  } else if (color === "red") {
    alertMessage.style.background = "rgba(239, 68, 68, 0.3)";
    alertMessage.style.border = "1px solid rgba(239, 68, 68, 0.4)";
    alertMessage.style.boxShadow = "0 0 20px rgba(239, 68, 68, 0.2), inset 0 0 10px rgba(239, 68, 68, 0.05)";
    alertAnimation();
  } else if (color === "orange") {
    alertMessage.style.background = "rgba(249, 115, 22, 0.3)";
    alertMessage.style.border = "1px solid rgba(249, 115, 22, 0.4)";
    alertMessage.style.boxShadow = "0 0 20px rgba(249, 115, 22, 0.2), inset 0 0 10px rgba(249, 115, 22, 0.05)";
    alertAnimation();
  } else if (color === "yellow") {
    alertMessage.style.background = "rgba(234, 179, 8, 0.3)";
    alertMessage.style.border = "1px solid rgba(234, 179, 8, 0.4)";
    alertMessage.style.boxShadow = "0 0 20px rgba(234, 179, 8, 0.2), inset 0 0 10px rgba(234, 179, 8, 0.05)";
    alertAnimation();
  }
}

// -------------------------------------------------------------

// 初始化返回顶部按钮
function initBackToTop() {
  const backToTopBtn = document.getElementById("back-to-top");
  if (!backToTopBtn) return;

  backToTopBtn.addEventListener('click', function () {
    showAlert("green", "<i class=\"fa fa-hand-pointer-o\" aria-hidden=\"true\"></i>&nbsp;Go! Go! Go! 正在返回顶部！");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 监听滚动事件
  window.addEventListener("scroll", function () {
    const scrollTop = window.scrollY;
    if (scrollTop > 0) {
      backToTopBtn.style.visibility = "visible";
    } else {
      backToTopBtn.style.visibility = "hidden";
    }
  });
}

// -------------------------------------------------------------

// 侧边栏相关功能
function initSidebar() {
  const body = document.querySelector("body");
  const overlay = document.querySelector(".overlay");
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebarClose = document.getElementById("sidebar-close");

  if (!overlay || !sidebar || !sidebarToggle || !sidebarClose) return;

  // 点击遮罩关闭侧边栏
  overlay.addEventListener("click", hideSidebar);

  // 阻止侧边栏点击事件冒泡
  sidebar.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  // 点击按钮显示侧边栏
  sidebarToggle.addEventListener("click", showSidebar);

  // 点击按钮关闭侧边栏
  sidebarClose.addEventListener("click", hideSidebar);

  // 显示侧边栏
  function showSidebar() {
    sidebar.style.animation = "none";
    overlay.style.animation = "none";

    overlay.offsetHeight;

    sidebar.style.animation = "showSidebarAnimation 0.5s forwards";
    overlay.style.animation = "showOverlayAnimation 0.5s forwards";

    overlay.style.display = "block";
    sidebar.style.display = "flex";

    body.style.overflow = "hidden";
  }

  // 隐藏侧边栏
  function hideSidebar() {
    sidebar.style.animation = "none";
    overlay.style.animation = "none";

    overlay.offsetHeight;

    sidebar.style.animation = "hideSidebarAnimation 0.5s forwards";
    overlay.style.animation = "hideOverlayAnimation 0.5s forwards";

    setTimeout(function () {
      overlay.style.display = "none";
      body.style.overflow = "auto";
    }, 500);
  }
}

// -------------------------------------------------------------

// 设置高度变量
function setNavHeightVar() {
  const nav = document.getElementById('navbar');
  if (nav) {
    const height = nav.offsetHeight;
    document.documentElement.style.setProperty('--nav-height', `${height}px`);
  }
}

// -------------------------------------------------------------

function loading() {
  const firstLoading = localStorage.getItem('firstLoading') || "true";

  if (firstLoading !== "false") {
    const body = document.body;
    const qingBlogIcon = document.querySelector('.loading-icon');
    const loading = document.querySelector('.loading');
    const loadingDivs = document.querySelectorAll('.loading-div');

    if (loading) {
      body.style.overflow = "hidden";

      setTimeout(function () {
        loadingDivs.forEach(function (div, index) {
          index += 1;

          if (index % 2 === 0) {
            div.style.animation = "loadingRightAnimation 1.5s ease-out forwards";
          } else {
            div.style.animation = "loadingLeftAnimation 1.5s ease-out forwards";
          };
        });

        qingBlogIcon.style.animation = "hideOverlayAnimation 0.5s ease-in-out forwards";
      }, 1600);

      setTimeout(function () {
        loading.style.display = "none";
        body.style.overflow = "auto";

        localStorage.setItem('firstLoading', 'false');
      }, 3000);
    }
  } else {
    const loading = document.querySelector('.loading');
    if (loading) loading.style.display = "none";
  }
}

// -------------------------------------------------------------

// 主题切换
function themesToggle() {
  const body = document.querySelector('body');
  const toggle = document.getElementById('theme-toggle');
  const prefersColorScheme = matchMedia('(prefers-color-scheme: dark)').matches

  const root = document.documentElement;

  function applyTheme(theme) {
    const themeConfig = themes[theme];

    Object.entries(themeConfig).forEach(function ([key, value]) {
      root.style.setProperty(key, value);
    });
  }

  if (!localStorage.getItem('theme')) {
    applyTheme(prefersColorScheme === true ? 'dark' : 'light');
    toggle.innerHTML = `<i class="fa fa-${prefersColorScheme === true ? 'moon' : 'sun'}-o"></i>`
  } else {
    applyTheme(localStorage.getItem('theme'));
    toggle.innerHTML = `<i class="fa fa-${localStorage.getItem('theme') === 'dark' ? 'moon' : 'sun'}-o"></i>`
  };

  toggle.addEventListener('click', () => {
    const newTheme = (localStorage.getItem('theme')) === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    toggle.innerHTML = `<i class="fa fa-${newTheme === 'light' ? 'sun' : 'moon'}-o"></i>`
    showAlert('green', `<i class="fa fa-${newTheme === 'light' ? 'sun' : 'moon'}-o"></i>&nbsp;已切换到${newTheme === 'light' ? '浅色' : '深色'}主题！`);
  });
}

// -------------------------------------------------------------

function preCopy() {
  document.querySelectorAll('.copy-btn').forEach(function(copyBtn) {
    copyBtn.addEventListener('click', function() {
      const parents = this.parentElement;

      const code = parents.querySelector('code').textContent;
      
      navigator.clipboard.writeText(code);

      showAlert('green', '<i class="fa fa-check-square-o" aria-hidden="true"></i>&nbsp;复制成功！');
    })
  })
}

// -------------------------------------------------------------

// DOM加载完成后初始化所有功能
window.addEventListener('DOMContentLoaded', function () {
  initBackToTop();
  initSidebar();
  initWebTitle();
  setNavHeightVar();
  themesToggle();
  loading();
  preCopy();
});

// 监听窗口大小变化
window.addEventListener('resize', setNavHeightVar);

// -------------------------------------------------------------
