import { URL } from 'url';

function getRateLimitKey(targetUrl) {
  const urlObj = new URL(targetUrl.toString());
  let path = urlObj.pathname;
  path = path.replace(/\/\d+(?=\/|$)/g, '/{id}');
  path = path.replace(/\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\/|$)/g, '/{id}');
  return `${urlObj.hostname}${path}`;
}

console.log(getRateLimitKey('https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=123456789&SoloActivos=false&pagina=1'));
console.log(getRateLimitKey('https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/12345'));
