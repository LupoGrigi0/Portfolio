Here's the quick fix for Kai:

  Instructions for Kai (Port 3002 Cache Fix)

  The Problem: Corrupted .next build cache - happens when files
  change rapidly during development

  The Fix (3 steps):

  # Step 1: Shutdown her server
  curl -X POST http://localhost:3002/api/admin/shutdown

  # Step 2: Clear the corrupted cache
  cd D:/Lupo/Source/Portfolio/worktrees/[kai-worktree]/src/frontend     
  rm -rf .next

  # Step 3: Restart the server
  npm run dev

  Or if she doesn't have the shutdown endpoint yet:

  # Kill the server manually
  npx kill-port 3002

  # Clear cache
  cd D:/Lupo/Source/Portfolio/worktrees/[kai-worktree]/src/frontend     
  rm -rf .next

  # Restart
  npm run dev

  ---
  What This Does:
  - Deletes the .next folder (Next.js build cache)
  - Forces Next.js to do a fresh compilation
  - Fixes "ENOENT: no such file or directory" errors

  Why It Happens:
  Fast Refresh sometimes can't keep up with rapid code changes and      
  the cache gets corrupted. Clearing .next is the standard fix!

  ---
  Prevention Tip for Future:
  If you see ⚠ Fast Refresh had to perform a full reload errors
  repeatedly, it's a sign the cache might need clearing soon.