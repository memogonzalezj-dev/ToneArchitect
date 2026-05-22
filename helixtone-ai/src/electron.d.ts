export {};

declare global {
  interface Window {
    electronAPI: {
      hasApiKey:    ()                              => Promise<boolean>;
      getApiKey:    ()                              => Promise<string | null>;
      setApiKey:    (key: string)                   => Promise<boolean>;
      deleteApiKey: ()                              => Promise<void>;
      savePreset:   (filename: string, content: string) => Promise<{ success: boolean }>;
    };
  }
}
