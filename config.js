/*
  Настройки сайта. Меняй только этот файл.

  Откуда сайт берёт установщик (проверяется по порядку):
  1) downloadUrl: готовая публичная ссылка на .dmg;
  2) githubUser + githubRepo: установщик в GitHub Releases (рекомендуется, сайт сам узнаёт версию, размер и дату);
  3) localPath: файл лежит в папке downloads рядом с сайтом (подходит только для файла меньше 100 МБ);
  4) ничего не найдено: кнопка неактивна и честно пишет, что версия скоро появится.
*/
window.JARVIS_SITE = {
  name: 'JARVIS',
  version: '1.0.0',
  platform: 'macOS',
  arch: 'Intel (x64)',

  githubUser: 'Mimic24-25',
  githubRepo: 'jarvis',
  assetName: 'JARVIS-Installer.dmg',

  downloadUrl: '',
  downloadSize: '',
  downloadDate: '',

  localPath: 'downloads/JARVIS-Installer.dmg',
};
