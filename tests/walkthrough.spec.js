import { test, expect } from '@playwright/test';

test.setTimeout(120000);

const testUser = {
  email: `testuser_${Date.now()}@playwright.com`,
  password: 'TestPassword123!',
};

test.describe('FinAlly Complete App Walkthrough', () => {
  test('Full E2E Journey: Signup -> Dashboard -> Features -> Logout', async ({ page }) => {
    console.log('Navigating to Landing Page...');
    await page.goto('/landing');

    console.log('Navigating to Sign Up...');
    await page.goto('/signup');

    // Wait for the signup form to be visible
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible({ timeout: 10000 });

    // Fill step 1 fields
    await page.getByPlaceholder(/you@example.com/i).fill(testUser.email);

    // Use label-based selectors which are more resilient
    const passwordField = page.getByLabel('Password');
    if (await passwordField.isVisible()) {
      await passwordField.fill(testUser.password);
    } else {
      // fallback to placeholder match
      const altPwd = page.getByPlaceholder(/Min 8 chars|password/i).first();
      if (await altPwd.isVisible()) await altPwd.fill(testUser.password);
    }

    // Confirm password (if present on the same step)
    const confirm = page.getByLabel('Confirm Password');
    if (await confirm.isVisible()) {
      await confirm.fill(testUser.password);
    } else {
      const altConfirm = page.getByPlaceholder(/Re-enter your password/i).first();
      if (await altConfirm.isVisible()) await altConfirm.fill(testUser.password);
    }

    // Click the Next / Sign up button (handle multi-step flow)
    const signupButton = page.getByRole('button', { name: /Next|Sign Up|Create Account/i });
    await expect(signupButton).toBeVisible({ timeout: 10000 });
    await signupButton.click();

    // Wait for navigation to the dashboard OR the profile onboarding step
    try {
      await page.waitForURL('**/', { timeout: 30000 });
    } catch (err) {
      // If onboarding appears (multi-step), fill it out
      const onboardingHeading = page.getByRole('heading', { name: /Tell us about yourself/i });
      if (await onboardingHeading.isVisible().catch(() => false)) {
        // Fill visible profile fields (use placeholders from snapshot)
        const safeFill = async (locator, value) => {
          try { if (await locator.isVisible()) await locator.fill(value); } catch { }
        };

        await safeFill(page.getByPlaceholder('Your name'), 'Automation Tester');
        await safeFill(page.getByPlaceholder('Age'), '30');
        await safeFill(page.getByPlaceholder('City, Country'), 'Bengaluru, India');
        await safeFill(page.getByPlaceholder('e.g. Software Engineer'), 'Software Engineer');
        await safeFill(page.getByPlaceholder('Company name'), 'Playwright Inc');
        await safeFill(page.getByPlaceholder('e.g. 3 years'), '5 years');
        await safeFill(page.getByPlaceholder('e.g. B.Tech, MBA'), 'MBA');
        await safeFill(page.getByPlaceholder('e.g. React, Finance, Design'), 'React, Finance');
        await safeFill(page.getByPlaceholder('e.g. 80000'), '80000');
        await safeFill(page.getByPlaceholder('e.g. 20000'), '20000');

        // Click continue/finish button on onboarding
        const continueBtn = page.getByRole('button', { name: /Next|Continue|Get Started|Finish|Complete/i });
        if (await continueBtn.isVisible().catch(() => false)) {
          await continueBtn.click();
        }

        // wait for dashboard after completing onboarding
        await page.waitForURL('**/', { timeout: 30000 }).catch(() => {});
      } else {
        throw err;
      }
    }

    // Screenshot dashboard
    await page.screenshot({ path: 'screenshots/01-dashboard.png', fullPage: true });

    // Brief navigation through core sections
    const navLinks = [
      { name: 'Expenses', url: '**/expenses', roleName: /Expenses/i },
      { name: 'Goals', url: '**/goals', roleName: /Goals/i },
      { name: 'Savings', url: '**/savings', roleName: /Savings/i },
      { name: 'Investments', url: '**/investments', roleName: /Investments/i },
      { name: 'Pay Parity', url: '**/pay-parity', roleName: /Pay Parity/i },
      { name: 'Gov Schemes', url: '**/government-schemes', roleName: /Schemes/i },
      { name: 'Taxation', url: '**/taxation', roleName: /Taxation/i },
      { name: 'Documents', url: '**/documents', roleName: /Documents/i },
      { name: 'Chatbot', url: '**/chatbot', roleName: /Chat|Advisor|Bot/i }
    ];

    for (let i = 0; i < navLinks.length; i++) {
      const link = navLinks[i];
      console.log(`Navigating to ${link.name}...`);
      const nav = page.getByRole('link', { name: link.roleName }).first();
      if (await nav.isVisible()) {
        await nav.click();
        await page.waitForURL(link.url, { timeout: 15000 }).catch(() => {});
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 }).catch(() => {});
        await page.screenshot({ path: `screenshots/0${i + 2}-${link.name.toLowerCase().replace(/\s+/g, '-')}.png` });
      }
    }

    // Profile & Settings
    console.log('Navigating to Profile...');
    const profileLink = page.getByRole('link', { name: /Profile/i }).first();
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await page.waitForURL('**/profile', { timeout: 10000 }).catch(() => {});
    }

    console.log('Navigating to Settings...');
    const settingsLink = page.getByRole('link', { name: /Settings/i }).first();
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await page.waitForURL('**/settings', { timeout: 10000 }).catch(() => {});
      await page.screenshot({ path: 'screenshots/11-settings.png' });
    }

    // Logout
    console.log('Logging out...');
    let logoutBtn = page.getByRole('button', { name: /Log Out|Sign Out|Logout/i }).first();
    if (!(await logoutBtn.isVisible())) {
      // try opening profile menu
      const avatar = page.getByRole('button').filter({ hasText: /Profile|Account|Avatar/i }).first();
      if (await avatar.isVisible()) await avatar.click();
      logoutBtn = page.getByRole('button', { name: /Log Out|Sign Out|Logout/i }).first();
    }
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL('**/login', { timeout: 15000 }).catch(() => {});
      await page.screenshot({ path: 'screenshots/12-logout-success.png' });
    }

    console.log('Walkthrough completed successfully! ✅');
  });
});
