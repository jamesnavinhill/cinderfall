import { bootstrapCinderfallApp } from '@/app/CinderfallApp';
import '@/styles/global.css';

const appHost = document.querySelector<HTMLDivElement>('#app');

if (!appHost) {
  throw new Error('Unable to find #app mount point.');
}

bootstrapCinderfallApp(appHost);
