# Steam to Telegram Message Forwarder

This application forwards all your Steam messages to a Telegram chat. You can respond to the messages from Telegram and they will be forwarded back to Steam to the sender of the previous message. You can also use Telegram's reply feature to reply to specific users, should multiple users message you at the same time.

## How to use

You have to run an instance of the bot locally, i.e. you must create configure a new Telegram bot using @BotFather. This is because it would not be very secure for a single Telegram bot application to be logged in to multiple Steam clients.

### Setup

1. Create a .env file with the contents from .env.example.
2. Register a new Telegram bot by contacting @BotFather. Consult Google if you have problems.
3. Set your Telegram bot API key in the .env file.
4. Set your Telegram username in the .env file. The bot only accepts messages from you, so you need to tell it your Telegram username.
5. Set the server port in the .env file. This is optional. Leave the server port commented if you do not wish to use the web interface.
6. If you wish to use the autologin feature, set your Steam username, password and secret in the .env file. If you do not want this feature, leave all of them commented out.


### Usage

Start the program using "node index.js". You can give the Steam username, password and current authentication code as command line parameters.

Use the command "/help" on Telegram to get the list of available commands.

## Used libraries

Refer to these open source libraries if you wish to extend the functionality:

[Node Steam User](https://github.com/DoctorMcKay/node-steam-user)

[Node Telegram Bot Client](https://github.com/yagop/node-telegram-bot-api)