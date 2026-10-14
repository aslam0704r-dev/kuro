# KURO 3.9.1 compact install notice

The user requested a small rectangle in the right corner, styled like a Windows
notification, with one Install action that automatically selects Android APK or
Windows EXE. This is a bounded revision to the existing install flow.

Use the bottom-right area above KURO's navigation, with a 360px desktop width and
roughly 150px initial height; fit within mobile width/safe areas. Use a solid ink
surface (#181612), fine warm border (#514536), cream type (#f4ecdd), subdued detail
(#bfb29d) and the existing amber action (#dfbc82). Segoe UI/system type reflects the
requested Windows notification style, with a small existing KURO icon.

The notice is a non-modal region: no backdrop, page dimming, scroll lock or focus
trap. Automatic appearance preserves typing focus. Explicit opening focuses the
Install action. Close/Later retain the seven-day dismissal, and Escape works from
inside the notice. It hides on reader/auth routes and respects reduced motion.

Keep product copy short. Show the detected platform and one Install action.
Clicking it uses the verified existing APK/EXE download and gives one brief next
step; the OS must confirm installation. Browser installation remains a small
secondary option for unsupported/unavailable native downloads and explicit choice.

Website version 3.9.1 reuses native release 3.9.0 byte-for-byte. The clients already
load the live website and therefore receive this UI after redeployment. No native
rebuild, signing-key operation, Supabase migration or environment change is needed.
