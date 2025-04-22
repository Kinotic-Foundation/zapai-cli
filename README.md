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
@kinotic/zapai-cli/0.2.1 darwin-arm64 node-v22.13.1
$ zapai --help [COMMAND]
USAGE
  $ zapai COMMAND
...
```
<!-- usagestop -->

# Grok Commands: Detailed Guide

The `zapai grok` commands unlock the power of Grok 3, xAI's AI assistant, right in your terminal. Let’s start with the mind-blowing stuff—iterative file editing—then cover the essentials to get you zapping!

## Setup with `z grok config`

Before anything, you need to configure the CLI with a valid Grok cookie for authentication. Here’s how:

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

## Iterative Magic: Edit Files with Grok

Imagine uploading your code, docs, or any files, then having Grok tweak them step-by-step—all from your terminal. This is ZapAI’s killer feature, blending the `:` menu and `file` tool for real-time, iterative improvements. Here’s how it works:

- **Scenario:** Upload files, enable the file tool, and ask Grok to make custom changes incrementally.
- **How It Works:**
  1. Start a chat: `zapai grok chat`.
  2. Upload files: `:` > `Upload Files (Glob Pattern)` > `./src/*.js`.
  3. Enable tool: `:` > `Toggle Tool` > `file`.
  4. Request changes: `You: Add error handling to these JavaScript files`.
  5. Grok updates the files and the `file` tool saves them to disk.
  6. Iterate: `You: Now add logging to those files`.
- **Example:**
  ```
  You: :
  [Select "Upload Files (Browse)" > Pick `app.js`, `utils.js`]
  You: :
  [Select "Toggle Tool" > "file"]
  You: Refactor these files to use async/await
  ```
  - Grok processes `app.js` and `utils.js`, updates them with async/await, and the `file` tool saves the changes.
  - Next: `You: Add comments to the updated files`.
- **Why It’s Mind-Blowing:** This turns Grok into your AI co-editor. Update code (e.g., refactor, debug), refine docs (like this README!), or tweak any file-based project incrementally. Each change builds on the last, saved instantly, opening endless possibilities—code optimization, documentation polish, or even creative writing—all in one fluid workflow!

## Using `z grok chat`

Now that you’re hooked, here’s the basics to get started:

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

**Note:** Flags are great for scripts, but the `:` menu (below) is your interactive superpower.

### Persistence
- Conversation IDs are saved in `~/.config/z/config.json` as `activeConversationId`.
- New chats generate a unique ID, which becomes the active one unless overridden with `-c` or `-n`.

## More Advanced Functionality

### Interactive Menu (`:`)
Type `:` and Enter at the `You:` prompt to access this dynamic control hub. Beyond the iterative editing above, here’s what else it offers:

1. **Toggle Tool:**
   - Enable/disable tools like `file`.
   - Example: `:` > `Toggle Tool` > `file` > `You: Create a JSON config`.

2. **Upload Files (Glob Pattern):**
   - Upload up to 10 files with a glob (e.g., `./docs/*.txt`).
   - Example: `:` > `Upload Files (Glob Pattern)` > `./data/*.csv` > `You: Summarize these files`.

3. **Upload Files (Browse):**
   - Browse and select files interactively.
   - Example: `:` > `Upload Files (Browse)` > Pick `report.pdf` > `You: Summarize this PDF`.

4. **Save Point in Time:**
   - Bookmark your current state (e.g., `brainstorm-v1`).
   - Example: `:` > `Save Point in Time` > `session-2025`.

5. **Load Point in Time:**
   - Fork from a saved state into a new chat.
   - Example: `:` > `Load Point in Time` > `session-2025` > `You: Expand on this`.

### Commands (e.g., `:cd`, `:ls`)
Prefix with `:` for file system control:
- `:cd <path>`: Change directory.
  ```sh
  :cd ./projects
  ```
- `:ls`: List files.
- `:mkdir <name>`: Create a directory.
- `:rm <path>`: Remove a file or directory.

### Other Combinations
- **Upload and Analyze:** `:` > `Upload Files (Glob Pattern)` > `./data/*.csv` > `You: Summarize these CSV files`.
- **Tool Switch Mid-Chat:** `:` > `Toggle Tool` > `file` > `You: Output as JSON`.
- **Save and Resume:** `:` > `Save Point in Time` > `draft-1` > [Later] `:` > `Load Point in Time` > `draft-1`.

## Tips & Tricks
- **File Limits:** Max 10 files per message. Use the menu to upload more mid-session.
- **Verbose Mode:** With `-v` and a tool, see raw token streams for debugging.
- **Conversation Management:** Use `z grok conversations` to list and switch chats.

## Example Workflow
1. Configure: `zapai grok config`.
2. Start: `zapai grok chat`.
3. Upload: `:` > `Upload Files (Browse)` > Select `notes.md`.
4. Enable Tool: `:` > `Toggle Tool` > `file`.
5. Edit: `You: Rewrite this with better headings`.
6. Save: `:` > `Save Point in Time` > `notes-v1`.

ZapAI’s Grok integration is your terminal’s AI sidekick—fast, flexible, and ready to revolutionize how you work!

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

Start an interactive chat session with Grok 3, an AI assistant from xAI...

```
USAGE
  $ zapai grok chat [-c <value>] [-f <value>] [-v] [-t <value>] [-n]

FLAGS
  -c, --conversation=<value>  Use a specific conversation ID
  -f, --files=<value>         Glob pattern for files to upload
  -n, --new                   Force a new conversation
  -t, --tools=<value>         Enable a specific tool
  -v, --visible               Run with visible browser

DESCRIPTION

  Start an interactive chat session with Grok 3, an AI assistant from xAI...


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
