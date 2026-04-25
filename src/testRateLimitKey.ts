import { fetchWithSmartRetry } from './utils/fetchWithSmartRetry.js';

// The file doesn't export getRateLimitKey, so we'll mock it here to test it

function getRateLimitKey(targetUrl: string | URL): string {
  const urlObj = new URL(targetUrl.toString());
  let path = urlObj.pathname;
  path = path.replace(/\/\d+(?=\/|$)/g, '/{id}');
  path = path.replace(/\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(?=\/|$)/g, '/{id}');
  return `${urlObj.hostname}${path}`;
}

console.log('1:', getRateLimitKey('https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=11001333303620140026300&SoloActivos=false&pagina=1'));
console.log('2:', getRateLimitKey('https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=11001333303620180012300&SoloActivos=false&pagina=1'));
console.log('3:', getRateLimitKey('https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/123456789'));
console.log('4:', getRateLimitKey('https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Proceso/Actuaciones/987654321'));

