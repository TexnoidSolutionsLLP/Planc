# Error States

Say what happened, why, and what to do. `app/[store]/error.tsx` shows "Something went wrong — We couldn't load
this page right now. Your data is safe — try again in a moment." with a **Try again** button. The 404 page offers a
way home. Form errors appear inline or as an error toast (kept for 7s). Raw error codes and stack traces are never
shown to merchants or customers.
