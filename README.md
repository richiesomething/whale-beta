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
