declare namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_API_URL: string;
      REACT_APP_WS_URL: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
  
  declare var process: {
    env: NodeJS.ProcessEnv;
  };