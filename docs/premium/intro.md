---
id: intro
title: Premium System Architecture
sidebar_label: "💎 Premium Architecture"
---

import PremiumWall from '@site/src/components/PremiumWall';

<PremiumWall>

# Premium Content Demo

If you are reading this text, it means **two things**:
1. You successfully submitted the correct password on the `/login` page.
2. The Cloudflare Edge network detected your `premium_session_token`, bypassed the Middleware pause, and securely served this static HTML file.

This entire page acts as **"Option 3: Hard Paywall via Edge Middleware"**.

## Security Implications

Because the `premium_session_token` cookie was set with the `HttpOnly` flag by the `/api/login` endpoint, wicked third-party JavaScript running on this page **cannot steal your token**. 

If you clear your cookies or open an Incognito Window and try to visit `/premium/intro`, Cloudflare will instantly `302 Redirect` you back to the login wall without exposing a single byte of this internal markdown text!

</PremiumWall>
