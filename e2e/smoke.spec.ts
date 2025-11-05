import { test, expect } from '@playwright/test';

test('sign-in page renders hero copy', async ({ page }) => {
  await page.goto('/signin');
  await expect(page.getByRole('heading', { name: 'FullStride' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Email me a link' })).toBeVisible();
});
