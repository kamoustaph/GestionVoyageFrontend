/**
 * L'API est appelée en chemin relatif (/api) :
 * - en développement, `ng serve` la redirige vers http://localhost:8093 (voir proxy.conf.json) ;
 * - en production, nginx (ou l'ALB AWS) route /api vers le backend Spring.
 */
export const environment = {
  apiUrl: '/api',
};
