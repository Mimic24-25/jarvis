(() => {
  'use strict';

  const cfg = window.JARVIS_SITE || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const formatSize = (bytes) => `${Math.round(bytes / 1048576)} МБ`;
  const formatDate = (value) => new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const safeUrl = (url) => /^https:\/\//.test(url) || !/^[a-z][a-z0-9+.-]*:/i.test(url);

  let toastTimer = null;
  function toast(text, isError = false) {
    const node = $('#toast');
    node.textContent = text;
    node.className = `toast show${isError ? ' error' : ''}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.className = 'toast'; }, 5000);
  }

  // Ищем установщик: своя ссылка, GitHub Releases или файл рядом с сайтом.
  async function findInstaller() {
    if (cfg.downloadUrl) {
      return { url: cfg.downloadUrl, size: cfg.downloadSize, date: cfg.downloadDate ? formatDate(cfg.downloadDate) : '', version: cfg.version };
    }
    if (cfg.githubUser && cfg.githubRepo) {
      const repo = `${cfg.githubUser}/${cfg.githubRepo}`;
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
        if (response.status === 404) return null;
        if (response.ok) {
          const release = await response.json();
          const asset = (release.assets || []).find((item) => item.name === cfg.assetName);
          if (!asset) return { missing: true };
          return {
            url: asset.browser_download_url, size: formatSize(asset.size), date: formatDate(asset.updated_at),
            version: String(release.tag_name || '').replace(/^v/, '') || cfg.version,
          };
        }
      } catch { /* нет сети или исчерпан лимит API: постоянная ссылка ниже всё равно работает */ }
      return { url: `https://github.com/${repo}/releases/latest/download/${encodeURIComponent(cfg.assetName)}`, version: cfg.version };
    }
    try {
      const head = await fetch(cfg.localPath, { method: 'HEAD' });
      if (head.ok && !(head.headers.get('content-type') || '').includes('text/html')) {
        const size = Number(head.headers.get('content-length'));
        const modified = head.headers.get('last-modified');
        return { url: cfg.localPath, local: true, size: size ? formatSize(size) : '', date: modified ? formatDate(modified) : '', version: cfg.version };
      }
    } catch { /* файла нет */ }
    return null;
  }

  let installer = null;
  let checking = true;
  let unavailableText = 'Версия для macOS скоро появится';

  function renderDownload() {
    const ready = Boolean(installer && installer.url && safeUrl(installer.url));
    if (installer && installer.missing) unavailableText = 'Установщик временно недоступен, попробуй позже';

    $$('[data-download]').forEach((button) => {
      const label = $('.btn-label', button) || button;
      label.textContent = ready ? (button.classList.contains('small') ? 'Скачать' : 'Скачать для macOS') : (button.classList.contains('small') ? 'Скоро' : 'Скоро появится');
      button.setAttribute('aria-disabled', ready ? 'false' : 'true');
    });

    const platform = `${cfg.platform}, ${cfg.arch}`;
    const parts = ready
      ? [`версия ${installer.version || cfg.version}`, installer.size, platform, installer.date && `обновлено ${installer.date}`, '.dmg']
      : [platform, 'формат .dmg', unavailableText];
    $$('#downloadMeta, [data-meta]').forEach((node) => { node.textContent = parts.filter(Boolean).join(' · '); });
  }

  function startDownload() {
    if (checking) { toast('Проверяю версию, секунду…'); return; }
    if (!installer || !installer.url || !safeUrl(installer.url)) { toast(unavailableText); return; }
    const link = document.createElement('a');
    link.href = installer.url;
    link.rel = 'noopener';
    if (installer.local) link.download = 'JARVIS-Installer.dmg';
    document.body.append(link);
    link.click();
    link.remove();
    toast(`Загрузка началась: ${cfg.name} ${installer.version || cfg.version}${installer.size ? `, ${installer.size}` : ''}`);
  }

  $$('[data-download]').forEach((button) => button.addEventListener('click', startDownload));

  // Просмотр скриншотов
  const lightbox = $('#lightbox');
  const lightboxImage = $('img', lightbox);
  let lastFocus = null;
  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImage.removeAttribute('src');
    if (lastFocus) lastFocus.focus();
  }
  $$('.shot').forEach((button) => button.addEventListener('click', () => {
    lastFocus = button;
    lightboxImage.src = button.dataset.full;
    lightboxImage.alt = $('img', button).alt;
    lightbox.hidden = false;
    $('.close', lightbox).focus();
  }));
  lightbox.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !lightbox.hidden) closeLightbox(); });

  $('#footVersion').textContent = `версия ${cfg.version || ''}`;
  if (cfg.githubUser && cfg.githubRepo) {
    const repoLink = $('#repoLink');
    repoLink.href = `https://github.com/${cfg.githubUser}/${cfg.githubRepo}`;
    repoLink.hidden = false;
  }

  findInstaller().then((found) => { installer = found; }).catch(() => { installer = null; }).then(() => { checking = false; renderDownload(); });
})();
