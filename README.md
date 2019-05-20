# Whale-FE
*Name still WIP*

This subdirectory has the following for "Whale" to work:
- Front-end
  - Rendering code
  - Networking code (a way to talk to the server and for the server to talk to you, in game)
  - User input
  - Rudimentary animation code (for waves)
  - A working 'timer' that keeps server-time.
- Back-end
  - A mock-up of how to use sockets and rooms to create game instances.
  - An asset delivery system using Flask.
 
It needs:
- Front-end
  - Loading and displaying new choices from the server (see demo provided)
  - Better animations for clicking, fading (through some kind of client-side scheduler)
  - A better asset loading system (low priority)
- Back-end
  - DB hooks to store game, user data.
  - An implementation of one Whale game exposing handles for the same.

# Developer Tips
- Remember to clear cache and reload when testing client pages out. 'Ctrl+Shift+R' reloads and clears cache on Chrome.  
- You can enable a grid-view in rendered output for the C2d renderer by initializing "_dbgView" to true in the 
  C2dRenderer constructor in "harpoon.2d.js." This makes it much easier to adjust where tiles are placed.
- Remember to allow audio to be played in your browser's settings. **Some kind of alert for the user would be very 
  helpful.**
- I sincerely apologize for the messy state of "Harpoon"; it was written "fast and loose" and will be cleaned up shortly 
  as bugs are ironed out.
