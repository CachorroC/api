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
      'gacha'
    );
    await page.getByRole(
      'option', {
        name: '252954089001 - JUZGADO 001'
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
    ).dblclick();
    await page.getByRole(
      'menuitem', {
        name: '75'
      }
    ).click();
    await page.getByRole(
      'listitem'
    ).filter(
      {
        hasText: 'Siguiente'
      }
    ).click();
    await page.getByRole(
      'link', {
        name: 'ESTADO No. 35 DEL'
      }
    ).click();
    await page.getByRole(
      'link', {
        name: 'ESTADO No. 35 DEL'
      }
    ).click();
    await page.getByRole(
      'listitem'
    ).filter(
      {
        hasText: 'Anterior'
      }
    ).click();
    await page.getByRole(
      'link', {
        name: 'Notificación por Estado No.13'
      }
    ).click();
    await page.getByRole(
      'link', {
        name: 'ESTADO No. 13 DEL'
      }
    ).click();
  }
);