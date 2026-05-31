<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Dopzy — a task marketplace app built with React 19, Vite, and Supabase. The `posthog-js` browser SDK was installed and initialized at app startup. Users are identified on login and signup (with email, name, and role properties), and reset on logout. Twelve events are tracked across the full user journey: authentication, task creation (4-step wizard), CoTasker offer submission and acceptance, task lifecycle (completion, cancellation), review submission, CoTasker applications, and profile updates. Exception autocapture is enabled globally, and explicit `captureException` calls are wired into authentication error paths and profile save errors.

| Event | Description | File |
|---|---|---|
| `account_signed_up` | User successfully creates a new Dopzy account | `src/context/AuthContext.tsx` |
| `account_logged_in` | User successfully logs in to an existing account | `src/context/AuthContext.tsx` |
| `task_posted` | Client completes the 4-step wizard and posts a new task | `src/pages/client/NewTaskPage.tsx` |
| `task_viewed` | User opens a task detail page (top of offer conversion funnel) | `src/pages/TaskDetailPage.tsx` |
| `offer_submitted` | CoTasker submits an offer (price + message) on an open task | `src/pages/cotasker/CoTaskerTaskDetail.tsx` |
| `offer_accepted` | Client accepts a CoTasker's offer, assigning the task | `src/pages/client/ClientTaskDetail.tsx` |
| `offer_withdrawn` | CoTasker withdraws a previously submitted offer | `src/pages/cotasker/CoTaskerTaskDetail.tsx` |
| `task_completed` | Client marks a task as completed after the work is done | `src/pages/client/ClientTaskDetail.tsx` |
| `task_cancelled` | Client cancels an open or assigned task | `src/pages/client/ClientTaskDetail.tsx` |
| `review_submitted` | Client submits a star rating and comment for a completed task | `src/pages/client/ClientTaskDetail.tsx` |
| `cotasker_application_submitted` | User submits an application to become a CoTasker | `src/pages/MyTasksPage.tsx` |
| `profile_updated` | User saves changes to their profile | `src/pages/shared/ProfilePage.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/project/190468/dashboard/714495)
- [New signups over time](/project/190468/insights/3bqo09Rk) — Daily unique signups and logins
- [Key business actions trend](/project/190468/insights/KwAy33ar) — Task posts, offer submissions, acceptances, and completions
- [Offer conversion funnel](/project/190468/insights/VCmfy3lP) — Task view → offer submit → offer accepted
- [Task completion funnel](/project/190468/insights/V1BRpPL5) — Signup → task posted → offer accepted → task completed
- [Churn signals](/project/190468/insights/xkBzI3US) — Task cancellations and offer withdrawals over time

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
