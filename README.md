
# Stock Market Game

This is a Node.JS server using [sack.vfs](https://github.com/d3x0r/sack.vfs) for websockets and HTTP service; [JSOX](https://github.com/d3x0r/jsox) for message encoding; 
[@d3x0r/Popups](https://github.com/d3x0r/popups) for user interface dialogs.

Live [Demo](https://wpc-stock-market.herokuapp.com) at heroku.

## Howto

Squares you can move to or select are highlighted in gold.

Your current square is highlighted in pink.

In the beginning, you have to earn money by working at a job; the 4 squares in the center are various professions.  Each player takes a turn rolling the dice, and if
the number on the profession matches the dice, the player is payed that wage.  Once a player rolls and is paid a total of $1000, they must enter the stock market ring at a start square.
If a player begins their turn with $1000 or more, they must select a start space before rolling.

Around the stock market ring, squares have a direction that you must go as specified.  If you own some of a stock, when passing past a holders meeting square (Marked with `Limit 1`), you
may enter the stock holders meeting track, which will give you an amount of shares shown in the square for ever share you already own.

The Broker's Fee squares in the corners charge $10 per share; If you do not have enough cash to pay, you must sell stocks at the minimum market value to cover the cost.  If you still don't have 
enough money, you will be bankrupt, your cash will be reset to $0 and you will return to the workplace, and have to earn money.

On the corners are squares marked `Sell`; this require you to sell all shares of a stock (at minimum? at current market?).

At any time before the dice are rolled, you may sell stocks; this will make the sale at the current market value.

Most stock squares when you land on them, you may buy any amount of that stock at the current market price; at the meetings for stock holders, you are limited to purchasing 1 share.  These square will
also pay a dividend to each player, for each share they own of a stock.

Squares are also marked with `Up` and `Down` indicators which change the current market value.  When you move to these squares, this change is applied immediately.

`Quit` allows you to sign out of a game.  If you merely close your client and disconnect, your game will remain with you as a participant for the next time you login.

## Self Hosting?  Re-Hosting?

This should be straight forward... (Recommend at least more experience than 0)

Most classes are kept one per file; here's a rough cover of functionality.

- clone this repository
- npm install .
  - This will download some packages hosted on npmjs.com, build 1 c/c++ native plugin, and a few JS utilities for the display and protocols.
  - the build process will take 30 seconds to a minute maybe longer?  Depends on the speed of your system... but it's only a few files, so it's mostly CPU time compiling.
- npm run start
  - this just runs `node  --experimental-loader=sack.vfs/import.mjs  server/server.mjs` 
    - `--experimental-loader=sack.vfs/import.mjs` is a preload script to add import/require for `.json6` and `jsox`.
    - [server/server.mjs](server/server.mjs) - this serves HTTP static content and hosts a websocket frontend with default options to use port 8888; may specify port as a argument, or by setting an environment variable (Heroku uses the latter method).
       - [server/game.mjs](server/game.mjs) - this handles `accept()` and `connect()` methods for sockets, and provides a `onmessage()` handler.
         - [server/lobby.mjs](server/lobby.mjs) - this tracks who is currently in the lobby/between games.
         - [server/gameClass.mjs](server/gameClass.mjs) - this implements the actual 'business logic' for the game.  It has an array of `User()`s.
           - [server/user.mjs](server/user.mjs) - implements the player, has an array of `Stock()`s.  Has things like their cash and token color.
           - [ui/StockSpace.mjs](ui/stuckSpace.mjs) - Parser, translates the generic object received from protocol to an instance of a stock.  A 'stock space' on the board is one that references a stock, and this is the information that space would reference.  The server uses it because it is `stocks.jsox` parsed from confuration to a class representation.
           - [ui/stocks.mjs](ui/stocks.mjs) - this is a interface for a stock; it's sort of duplicated work with StockSpace; but this has convenicence functions for values.
           - [server/market.mjs](server/market.mjs) - This class tracks the current market value; and builds the lookup table of stock values.

- connect to a local ip at port `8888` (or other port if you figured it out; I doubt you'll have the environment variable set that this uses).
  - All of these files are private to the /ui/ directory.  The server only serves content from this directory and select node_module paths `[sack.vfs, jsox, @d3x0r/*]`.
  - [index.html](ui/index.html) - Empty; loads 'main.js'.
    - [main.js](ui/main.js) - roughly manages the connection state and attaches the login with the lobby dialog and the game form.
      - [gameProtocol.js](ui/gameProtocol.js) - a shared connection object that provides utility API to send messages to the server, and handle responses from the server, dispatching to registered event handler(s).
         - [events.js](ui/events.js) - a Generic `on(event,callback)`/`on(event,data)` event tracker.  (so much state to track, don't do it wrong....)
      - [login.js](ui/login.js) - creates a form that asks for the player name, and has some events it triggers on connect.  Registers some protocol events, calls some protocol methods.
      - [lobby.js](ui/lobby.js) - once connected, main open the lobby which gets updated with any other users connected, and logged in.  If they disconnect; they are removed; if they join a game; they are removed; if a game is created; it will appear; if a game is destroyed (last player quits), it is removed.
      - [board.js](ui/board.js) - This draws the game board, adds the game board to the body.  Hosts the game state mostly.  (This is a multi-class module, and could be split the board, the UI interactions, the animations, The game state,...
        - [gameWait.js](ui/gameWait.js) - This is a window that waits for other player to join, allowing you to choose a token color, and starting space.
        - [buyForm.js](ui/buyForm.js) - This manages buying stocks for the player, when they land on an appropriate square.
        - [sellForm.js](ui/sellForm.js) - Manages selling player stocks; both at the current market cost, and possibly at the miminum market value (recovering from a negative cash value).
        - [DebtForm.js](ui/debtForm.js) - (unused?)
        - [playerStatusForm.js](ui/PlayerStatusForm.js) - a popup window showing the current players of the game, what the die rolls have been, what your current value and stocks are.
        - [stockForm.js](ui/stockForm.js) - this is the form that shows the central ticker on the board. 
        - [stockSpace.mjs](ui/stockSpace.mjs) - used to configure the stock parameters.  (shared with server)
        



![Screenshot](CoverImage.png)


## Privacy Statement

The Application asks for a username to start; Please keep this clean and repectful to general audiences.  

The selected name is saved in the `localStorage` facility; which is private to this application.  It requires some small amount of storage for the name and value tags in a database somewhere.  The username is sent
automatically upon connection with the application server to identify you.  This name will be used in the Lobby facility and shown to anyonee in the lobby.

Creating a game will use your entered name plus a string to make a name of a game.  This game name will appear on the list of available games for players in the lobby to join.

Once you are entered into a game, you are removed from the lobby; Upon re-connection to the same user account, you will resume in the game you left; until you quit that game.

Players are only allowed a single connection, a second connection will disconnect the first; and it may be generate periodic continuous reconnects.

The last player to leave a game will delete the game from the server.

The server currently only has a memory image of the games, and does not persist any games or users in any storage.

Normally server logs will not include your IP; although (un)certain error conditions may log the connection information.

Heroku router logs connection information like

```
 at=info method=GET path="/" host=wpc-stock-market.herokuapp.com request_id=b85f19cf-a695-46f3-9f3e-1e120c757de1 fwd="your-ip-here" dyno=web.1 connect=0ms service=116054ms status=101 bytes=14105 protocol=https
```

which I get, but don't have control over; so instead I offer: this information will never be used for any purpose.