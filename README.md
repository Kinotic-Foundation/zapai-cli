# ZapAI CLI ⚡

**Chat fast, work smart, zap into AI awesomeness—experimentally!**

Welcome to **ZapAI**, the CLI that turbocharges your conversations with AI powerhouses like Grok 3 (xAI) and ChatGPT (OpenAI). Tired of sluggish web UIs or juggling browser tabs? ZapAI brings lightning-fast, interactive AI chats to your terminal—upload files, wield tools, save sessions, and switch AIs with a few keystrokes. Whether you're brainstorming with Grok or querying ChatGPT, ZapAI’s got your back with a snappy, extensible interface that fits your workflow.

### Why ZapAI?
- **Speed**: Zap into AI chats instantly—no browser bloat, just pure terminal velocity.
- **Power**: Supports Grok and ChatGPT with file uploads, tools (e.g., JSON file writing), and state management.
- **Flexibility**: Seamless new or resumed conversations, all configurable via a slick menu.
- **Catchy**: Because who doesn’t want to `zapai grok chat` their way to brilliance?

### ⚠️ Disclaimer
**ZapAI is an experimental tool—use at your own risk!** All features are in early development and may break, change, or zap out unexpectedly. This CLI interacts with Grok and ChatGPT APIs, sometimes bypassing web browser protections (e.g., for Grok 3). **Do not use ZapAI in any way that violates the terms of service of Grok, ChatGPT, xAI, or OpenAI.** Respect their rules, rate limits, and usage policies—misuse could lead to account bans or legal issues. Built for fun, learning, and experimentation, not for production or mischief!

Built with ❤️ by Navíd Mitchell 🤝 Grok to make AI as fast as your thoughts. Dive in, zap around, and let’s make AI work for *you*—responsibly! Issues or ideas? [Open a ticket](https://github.com/kinotic-foundation/zapai-cli/issues) or PR—we’re all about community vibes!

The CLI to help you move fast—experimentally!

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@kinotic/zapai-cli.svg)](https://npmjs.org/package/@kinotic/zapai-cli)
[![Downloads/week](https://img.shields.io/npm/dw/@kinotic/zapai-cli.svg)](https://npmjs.org/package/@kinotic/zapai-cli)


<!-- toc -->
* [ZapAI CLI ⚡](#zapai-cli-)
* [Usage](#usage)
* [Grok Commands: Detailed Guide](#grok-commands-detailed-guide)
* [Commands](#commands)
<!-- tocstop -->

# Usage
<!-- usage -->
```sh-session
$ npm install -g @kinotic/zapai-cli
$ zapai COMMAND
running command...
$ zapai (--version)
@kinotic/zapai-cli/0.1.1 darwin-arm64 node-v22.13.1
$ zapai --help [COMMAND]
USAGE
  $ zapai COMMAND
...
```
<!-- usagestop -->

# Grok Commands: Detailed Guide

The `zapai grok` commands unlock the power of Grok 3, xAI's AI assistant, right in your terminal. Whether you're starting fresh, resuming a chat, uploading files, or wielding advanced tools, this section walks you through setup, basic usage, and advanced functionality. Let’s zap into it!

## Setup with `z grok config`

Before chatting with Grok, you need to configure the CLI with a valid Grok cookie for authentication. Here’s how:

1. **Run the Config Command:**
   ```sh
   $ zapai grok config
   ```
   This prompts you to provide a Grok cookie, typically obtained from your browser while logged into `grok.com`.

2. **How to Get the Cookie:**
   - Open your browser, log into `grok.com`.
   - Open Developer Tools (F12 or right-click > Inspect).
   - Go to the "Network" tab, refresh the page, and find a request to `grok.com`.
   - Copy the `Cookie` header value from the request.

3. **Provide the Cookie:**
   - Paste the cookie when prompted by `z grok config`.
   - The CLI stores it securely in `~/.config/z/config.json`.

4. **Verify:**
   - The CLI uses this cookie for all subsequent `grok` commands. If it expires or fails, re-run `z grok config`.

**Note:** Keep your cookie safe—don’t share it publicly! Misuse may violate xAI’s terms of service.

## Using `z grok chat`

The `z grok chat` command starts an interactive session with Grok 3. It’s flexible, persistent, and packed with features. Here’s the basics and beyond:

### Basic Usage
- **Start a Chat:**
  ```sh
  $ zapai grok chat
  ```
  - Resumes the last active conversation (stored in `~/.config/z/config.json`) or starts a new one if none exists.
  - You’ll see a prompt: `You:`. Type your message and hit Enter to chat with Grok.

- **Exit:**
  - Type `\q` and press Enter to end the session.

### Flags for Customization
- `-c, --conversation=<id>`: Resume a specific conversation by ID.
  ```sh
  $ zapai grok chat -c abc123
  ```
- `-n, --new`: Force a new conversation, ignoring the active one.
  ```sh
  $ zapai grok chat -n
  ```
- `-v, --visible`: Show the browser UI (non-headless mode) for debugging or CAPTCHA handling.
  ```sh
  $ zapai grok chat -v
  ```
- `-f, --files=<glob>`: Upload files before chatting (max 10 per message).
  ```sh
  $ zapai grok chat -f "./docs/*.md"
  ```
- `-t, --tools=<tool>`: Enable a tool (e.g., `file` for JSON responses).
  ```sh
  $ zapai grok chat -t file
  ```

### Persistence
- Conversation IDs are saved in `~/.config/z/config.json` as `activeConversationId`.
- New chats generate a unique ID, which becomes the active one unless overridden with `-c` or `-n`.

## Advanced Functionality

### Interactive Menu (`:`)
Type `:` and Enter during a chat to open the menu. It’s your control hub for advanced features:

1. **Toggle Tool:**
   - Enable/disable tools like `file` (writes JSON responses to disk).
   - Example: Select `file` to process structured outputs.

2. **Upload Files (Glob Pattern):**
   - Enter a glob (e.g., `./docs/*.txt`) to upload up to 10 files.
   - Files attach to your next message for Grok to analyze.

3. **Upload Files (Browse):**
   - Interactively browse and select files using arrow keys.
   - Great for precise uploads without typing paths.

4. **Save Point in Time:**
   - Save the current conversation state with a name (e.g., `brainstorm-v1`).
   - Stores the last response ID in `config.json` under `savedPoints`.

5. **Load Point in Time:**
   - Pick a saved state to fork into a new conversation.
   - Preserves context from that point onward.

### Commands (e.g., `:cd`, `:ls`)
Prefix commands with `:` for file system control:
- `:cd <path>`: Change the working directory.
  ```sh
  :cd ./projects
  ```
- `:ls`: List files in the current directory.
- `:mkdir <name>`: Create a directory.
- `:rm <path>`: Remove a file or directory.

### Tools
Tools enhance Grok’s responses:
- **File Tool (`-t file`):**
  - Preprocesses prompts and postprocesses responses as JSON.
  - Example: Ask Grok to generate a config file, and it’ll write it to disk.
  - Usage:
    ```sh
    $ zapai grok chat -t file
    You: Create a JSON config with {"name": "test", "value": 42}
    ```

### Combining Features
- **Upload and Analyze:**
  ```sh
  $ zapai grok chat -f "./data/*.csv"
  You: Summarize these CSV files
  ```
- **Debug with Tools:**
  ```sh
  $ zapai grok chat -v -t file -n
  ```
- **Resume and Save:**
  ```sh
  $ zapai grok chat -c xyz789
  You: : (select "Save Point in Time")
  ```

## Tips & Tricks
- **File Limits:** Max 10 files per message. Use the menu to upload more mid-session.
- **Verbose Mode:** With `-v` and a tool, see raw token streams for debugging.
- **Conversation Management:** Use `z grok conversations` to list and switch chats.

## Example Workflow
1. Configure: `zapai grok config`.
2. Start with files: `zapai grok chat -f "./notes/*.md"`.
3. Chat: `You: Summarize my notes`.
4. Menu: `:` > "Toggle Tool" > `file`.
5. Generate: `You: Output summaries as JSON`.
6. Save: `:` > "Save Point in Time" > `notes-summary`.

ZapAI’s Grok integration is your terminal’s AI sidekick—fast, flexible, and ready to experiment!

# Commands
<!-- commands -->
* [`zapai autocomplete [SHELL]`](#zapai-autocomplete-shell)
* [`zapai gpt assistants`](#zapai-gpt-assistants)
* [`zapai gpt chat`](#zapai-gpt-chat)
* [`zapai gpt config`](#zapai-gpt-config)
* [`zapai gpt resetFiles`](#zapai-gpt-resetfiles)
* [`zapai gpt resetStore`](#zapai-gpt-resetstore)
* [`zapai gpt upload PATTERN`](#zapai-gpt-upload-pattern)
* [`zapai grok chat`](#zapai-grok-chat)
* [`zapai grok config`](#zapai-grok-config)
* [`zapai grok conversations`](#zapai-grok-conversations)
* [`zapai help [COMMAND]`](#zapai-help-command)

## `zapai autocomplete [SHELL]`

Display autocomplete installation instructions.

```
USAGE
  $ zapai autocomplete [SHELL] [-r]

ARGUMENTS
  SHELL  (zsh|bash|powershell) Shell type

FLAGS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

DESCRIPTION
  Display autocomplete installation instructions.

EXAMPLES
  $ zapai autocomplete

  $ zapai autocomplete bash

  $ zapai autocomplete zsh

  $ zapai autocomplete powershell

  $ zapai autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v3.2.26/src/commands/autocomplete/index.ts)_

## `zapai gpt assistants`

Select the default ChatGPT assistants to use

```
USAGE
  $ zapai gpt assistants

DESCRIPTION
  Select the default ChatGPT assistants to use

EXAMPLES
  $ zapai gpt assistants
```

## `zapai gpt chat`

Start an interactive chat session with the default assistant

```
USAGE
  $ zapai gpt chat

DESCRIPTION
  Start an interactive chat session with the default assistant
```

## `zapai gpt config`

Configures Z for use

```
USAGE
  $ zapai gpt config

DESCRIPTION
  Configures Z for use

EXAMPLES
  $ zapai gpt config
```

## `zapai gpt resetFiles`

Delete all files listed in the OpenAI file management API.

```
USAGE
  $ zapai gpt resetFiles

DESCRIPTION
  Delete all files listed in the OpenAI file management API.
```

## `zapai gpt resetStore`

Reset the vector store for the current assistant by deleting all files and removing the store.

```
USAGE
  $ zapai gpt resetStore

DESCRIPTION
  Reset the vector store for the current assistant by deleting all files and removing the store.
```

## `zapai gpt upload PATTERN`

Upload files to a ChatGPT assistant for the file_search tool

```
USAGE
  $ zapai gpt upload PATTERN [--dryRun]

ARGUMENTS
  PATTERN  File path or glob pattern to upload. Examples:
           - './data/*.txt' (all .txt files in the data directory)
           - './data/**/*.json' (all .json files recursively in the data directory)
           - '/absolute/path/to/file.csv' (specific file by absolute path)

FLAGS
  --dryRun  Print the files that will be uploaded without actually uploading them

DESCRIPTION
  Upload files to a ChatGPT assistant for the file_search tool
```

## `zapai grok chat`

Start an interactive chat session with Grok 3, an AI assistant from xAI. This command opens a browser session to grok.com, allowing real-time interaction with Grok. You can upload files, enable tools, save/load conversation states, and switch conversations via an interactive menu.

```
USAGE
  $ zapai grok chat [-c <value>] [-f <value>] [-v] [-t <value>] [-n]

FLAGS
  -c, --conversation=<value>  Use a specific conversation ID to resume an existing chat, overriding the active ID in
                              config.
  -f, --files=<value>         Glob pattern for files to upload before starting the chat (e.g., "./docs/*.txt"). Max 10
                              files will be uploaded and sent per message.
  -n, --new                   Force the creation of a new conversation, ignoring any active conversation ID in the
                              config. Useful for starting fresh without modifying config.
  -t, --tools=<value>         Enable a specific tool for the session (e.g., "file" to process JSON responses and write
                              files). Only one tool can be active at a time.
  -v, --visible               Run with a visible browser window (non-headless mode) instead of headless. Useful for
                              manual interaction or debugging.

DESCRIPTION

  Start an interactive chat session with Grok 3, an AI assistant from xAI. This command opens a browser session to
  grok.com, allowing real-time interaction with Grok. You can upload files, enable tools, save/load conversation states,
  and switch conversations via an interactive menu.

  Features:
  - Persistent conversation IDs stored in config (~/.config/z/config.json)
  - File uploads via glob patterns (max 10 files per message)
  - Tool integration (e.g., 'file' tool for JSON-based file writing)
  - Browser visibility toggle for debugging or manual interaction
  - Menu-driven options: toggle tools, upload files, save/load points in time
  - Automatic new conversation creation if none specified, with optional override

  Requires a valid Grok cookie configured via 'z grok config' for authentication.


EXAMPLES
  $ z grok chat

  Start a chat session, resuming the active conversation or creating a new one if none exists.



  $ z grok chat -v

  Run in visible mode to see the browser UI, useful for debugging or CAPTCHA resolution.



  $ z grok chat -c <conversation-id>

  Resume a specific conversation by ID, overriding the active one in config.



  $ z grok chat -n

  Force a new conversation, ignoring any active conversation ID in config.



  $ z grok chat -f "./docs/*.md" -t file

  Start a chat with up to 10 files uploaded from ./docs/*.md and enable the "file" tool for JSON responses.



  $ z grok chat -v -n -t file

  Start a new conversation in visible mode with the "file" tool enabled.
```

## `zapai grok config`

Configures the Grok CLI with a cookie

```
USAGE
  $ zapai grok config

DESCRIPTION
  Configures the Grok CLI with a cookie

EXAMPLES
  z grok config
```

## `zapai grok conversations`

List and select Grok conversations

```
USAGE
  $ zapai grok conversations

DESCRIPTION
  List and select Grok conversations

EXAMPLES
  z grok conversations
```

## `zapai help [COMMAND]`

Display help for zapai.

```
USAGE
  $ zapai help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for zapai.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.20/src/commands/help.ts)_
<!-- commandsstop -->
