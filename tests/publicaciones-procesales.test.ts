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
        name: 'Notificación por Estado No.016 de 11 de mayo de'
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
    const page2Promise = page.waitForEvent(
      'popup'
    );
    await page.getByRole(
      'link', {
        name: 'Estado 016 de 2026.pdf'
      }
    ).click();
    const page2 = await page2Promise;
    await page2.locator(
      'iframe[name="44AB0754BEA7FD51DF4EB8D69D9D1D07"]'
    ).contentFrame().locator(
      '#plugin'
    )
      .contentFrame()
      .locator(
        'embed'
      )
      .click();
  }
);