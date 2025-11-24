const { contextBridge } = require('electron');

// 프론트엔드에 안전하게 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron
});

