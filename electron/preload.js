const { contextBridge, ipcRenderer } = require('electron');

let progressCallback = null;

ipcRenderer.on('model-download-progress', (_, data) => {
  if (progressCallback) {
    progressCallback(data);
  }
});

contextBridge.exposeInMainWorld('electronAPI', {
  hasApiKey:        ()            => ipcRenderer.invoke('has-api-key'),
  getApiKey:        ()            => ipcRenderer.invoke('get-api-key'),
  setApiKey:        (key)         => ipcRenderer.invoke('set-api-key', key),
  deleteApiKey:     ()            => ipcRenderer.invoke('delete-api-key'),
  savePreset:       (name, data)  => ipcRenderer.invoke('save-helix-preset', { filename: name, content: data }),
  checkLlamaReady:  ()            => ipcRenderer.invoke('check-llama-ready'),
  checkModelAvailable: ()         => ipcRenderer.invoke('check-model-available'),
  downloadModel:    ()            => ipcRenderer.invoke('download-model'),
  generatePreset:   (config)      => ipcRenderer.invoke('generate-preset', config),
  onModelProgress:  (callback)    => { progressCallback = callback; },
});
