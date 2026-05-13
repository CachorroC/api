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
    await expect(
      page.getByRole(
        'link', {
          name: 'Icono Video Ver Video' 
        } 
      ) 
    ).toBeVisible();

    await page.locator(
      '.col-md-6 > .select2 > .selection > .select2-selection > .select2-selection__arrow' 
    ).click();
    await expect(
      page.getByRole(
        'link', {
          name: 'ES Spanish' 
        } 
      ) 
    ).toBeVisible();

    await page.getByRole(
      'searchbox', {
        name: 'Search' 
      } 
    ).dblclick();
    await page.getByRole(
      'searchbox', {
        name: 'Search' 
      } 
    ).fill(
      'chia' 
    );
    await page.getByRole(
      'option', {
        name: '251754003001 - JUZGADO 001' 
      } 
    ).click();
    await expect(
      page.getByRole(
        'combobox', {
          name: '251754003001 - JUZGADO 001' 
        } 
      ) 
    ).toBeVisible();

    await page.getByRole(
      'button', {
        name: 'Buscar' 
      } 
    ).click();
    await expect(
      page.getByRole(
        'link', {
          name: 'Icono Video Ver Video' 
        } 
      ) 
    ).toBeVisible();

    await page.getByRole(
      'link', {
        name: 'Notificación por Estado No.017 de 08 de mayo de' 
      } 
    ).click();
    await expect(
      page.getByRole(
        'row', {
          name: 'Nombre del Documento: Activar' 
        } 
      ) 
    ).toBeVisible();

    await page.getByRole(
      'link', {
        name: 'Estado No. 017 de 05-05-' 
      } 
    ).click();
    await page.goto(
      'https://publicacionesprocesales.ramajudicial.gov.co/web/publicaciones-procesales/inicio?p_p_id=co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_action=busqueda&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_idDepto=+&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_idDespacho=251754003001&_co_com_avanti_efectosProcesales_PublicacionesEfectosProcesalesPortletV2_INSTANCE_BIyXQFHVaYaq_verTotales=true' 
    );
    await expect(
      page.getByRole(
        'link', {
          name: 'Icono Video Ver Video' 
        } 
      ) 
    ).toBeVisible();

    await page.locator(
      '.col-md-6 > .select2 > .selection > .select2-selection > .select2-selection__arrow' 
    ).click();
    await expect(
      page.getByRole(
        'option', {
          name: 'Todos' 
        } 
      ) 
    ).toBeVisible();

    await page.getByRole(
      'option', {
        name: '251754003002 - JUZGADO 002' 
      } 
    ).click();
    await expect(
      page.getByRole(
        'combobox', {
          name: '251754003002 - JUZGADO 002' 
        } 
      ) 
    ).toBeVisible();

    await page.getByRole(
      'button', {
        name: 'Buscar' 
      } 
    ).click();
  } 
);