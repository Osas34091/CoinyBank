import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
 
export default createMiddleware(routing);
 
export const config = {
  // Solo se interceptan rutas que no sean de API o estáticas
  matcher: ['/', '/(es|en)/:path*']
};
