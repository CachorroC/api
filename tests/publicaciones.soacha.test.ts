import { test, expect } from '@playwright/test';

test(
  'test', async (
    {
      page 
    } 
  ) => {
    await page.goto(
      'https://publicacionesprocesales.ramajudicial.gov.co/' 
    );
    await page.locator(
      '.col-md-6 > .select2 > .selection > .select2-selection > .select2-selection__arrow' 
    ).click();
    await page.getByRole(
      'searchbox', {
        name: 'Search' 
      } 
    ).fill(
      'soacha' 
    );
    await page.getByRole(
      'option', {
        name: '257544189004 - JUZGADO 004 DE' 
      } 
    ).click();
    await page.getByRole(
      'button', {
        name: 'Buscar' 
      } 
    ).click();
    await page.getByRole(
      'link', {
        name: 'Resultados por página' 
      } 
    ).click();
    await page.getByRole(
      'menuitem', {
        name: '75' 
      } 
    ).click();
    await page.getByRole(
      'link', {
        name: 'Notificación por Estado No.016 de 11 de mayo de' 
      } 
    ).click();
    await page.getByText(
      '16', {
        exact: true 
      } 
    ).click();
    const page1Promise = page.waitForEvent(
      'popup' 
    );
    await page.getByRole(
      'link', {
        name: 'Estado 016 de 2026.pdf' 
      } 
    ).click();
    const page1 = await page1Promise;
    await page.goto(
      'https://publicacionesprocesales.ramajudicial.gov.co/web/publicaciones-procesales/inicio?p_p_id=co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_idDespacho=257544189004&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_idEspecialidad=&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_idEntidad=&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_idDepto=&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_idMuni=&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_fechaInicio=&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_fechaFin=&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_verTotales=true&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_action=busqueda&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_resetCur=false&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_delta=75' 
    );
    await page.getByRole(
      'link', {
        name: 'Siguiente' 
      } 
    ).click();
    await page.getByRole(
      'link', {
        name: 'Estado 031 de' 
      } 
    ).click();
    await page.getByText(
      '9', {
        exact: true 
      } 
    ).click();
    const page2Promise = page.waitForEvent(
      'popup' 
    );
    await page.getByRole(
      'link', {
        name: 'Estado031de2025 (1).pdf' 
      } 
    ).click();
    const page2 = await page2Promise;
  } 
);