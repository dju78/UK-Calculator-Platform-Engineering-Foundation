# FX Operations Runbook

## Overview
This runbook covers operational procedures for the FX Currency Conversion system (CON-010).

## 1. Provider Outage Management
If Frankfurter API is down:
- The system will throw `FX Fetch Failed` errors.
- **Action**: Check status of API. Switch `baseUrl` or swap to an alternative `FXProvider` implementation if prolonged.

## 2. Rate Stale Warnings
If rates are consistently stale:
- Verify container memory isn't evicting the cache incorrectly.
- Verify `staleTimeMs` config. 1 hour is default.

## 3. Rate Accuracy Verification
- Frankfurter updates daily at 16:00 CET.
- The Engine pulls "latest" rates. Do not expect real-time stock-market precision.
