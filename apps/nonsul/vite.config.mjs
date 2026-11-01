import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({base:'/nonsul/',resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},build:{outDir:'../../public-site/nonsul',emptyOutDir:true,assetsDir:'assets'}});
