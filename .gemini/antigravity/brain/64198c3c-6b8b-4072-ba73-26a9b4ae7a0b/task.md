# Task List — AtlasERP Redesign & Fixes

## 1. Data Layer & Currency Formatting
- [x] Implement `formatDA()` in [format.ts](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/src/lib/format.ts)
- [x] Bypass `CompanyKpi` cache checks in [dashboard.service.ts](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/src/services/dashboard.service.ts) and query DB directly
- [x] Fix Cameleon Colors monthly revenue fallback query in [dashboard.service.ts](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/src/services/dashboard.service.ts)
- [x] Update [health/route.ts](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/src/app/api/dashboard/health/route.ts) to query database directly

## 2. Localization & i18n
- [x] Add `units` and `activity_log` to French locale [fr.json](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/messages/fr.json)
- [x] Add `units` and `activity_log` to English locale [en.json](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/messages/en.json)
- [x] Add `units` and `activity_log` to Arabic locale [ar.json](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/messages/ar.json)

## 3. Notification Overhaul
- [x] Update notifications API route [route.ts](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/src/app/api/notifications/route.ts) to sync and return grouped alerts
- [x] Add tabs, status badges, and 60-second polling to [NotificationsDropdown.tsx](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/src/components/NotificationsDropdown.tsx)

## 4. AI Chatbot Major Upgrade
- [x] Install `react-markdown` and `remark-gfm` in the `web` folder
- [x] Add `getGroqChatCompletion` with full history support in [groq-client.ts](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/src/lib/ai/groq-client.ts)
- [x] Upgrade AI chat API route [route.ts](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/src/app/api/ai/chat/route.ts) with DB stats, JSON mode, and suggestions
- [x] Update [ai-chat-client.tsx](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/src/app/[locale]/(app)/ai/chat/ai-chat-client.tsx) with multi-turn history, dynamic suggestions, copy buttons, sidebar conversations, and prompt library
- [x] Update [chat-messages.tsx](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/src/components/ai/chat-messages.tsx) to render standard markdown with Tailwind prose styling

## 5. Dashboard Redesign
- [x] Redesign [dashboard-client.tsx](file:///C:/Users/LENOVO/Desktop/AtlasERP/web/src/app/[locale]/(app)/dashboard/dashboard-client.tsx):
  - [x] Use deep navy, electric blue, and accent green theme palette
  - [x] Section 1: Dark navy card (Treasury), Blue gradient card (CA), circular progress (Goal), donut gauge (Health)
  - [x] Section 2: Recharts performance bar chart with highlight and French tooltips, and treasury prog sparkline
  - [x] Section 3: Operations 3-column layouts using direct DB stats
  - [x] Section 4: Alerts and logistics listings
  - [x] Section 5: Top sells and translated activity logs
  - [x] Ensure full responsiveness, skeletons, and error handling

## 6. Verification & QA
- [/] Verify that the frontend compiles cleanly (`npm run build`)
- [ ] Verify that all metrics load correctly without zeros
- [ ] Verify the notification dropdown and tabs work
- [ ] Verify the AI Chatbot's multi-turn conversational capabilities
