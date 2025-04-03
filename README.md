@kinotic/zapai-cli
=================

The CLI to help you move fast!


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@kinotic/z-cli.svg)](https://npmjs.org/package/@kinotic/z-cli)
[![Downloads/week](https://img.shields.io/npm/dw/@kinotic/z-cli.svg)](https://npmjs.org/package/@kinotic/z-cli)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @kinotic/z-cli
$ zapai COMMAND
running command...
$ zapai (--version)
@kinotic/z-cli/0.1.0 darwin-arm64 node-v22.13.1
$ zapai --help [COMMAND]
USAGE
  $ zapai COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`zapai autocomplete [SHELL]`](#zapai-autocomplete-shell)
* [`zapai gpt assistants`](#zapai-gpt-assistants)
* [`zapai gpt chat`](#zapai-gpt-chat)
* [`zapai gpt config`](#zapai-gpt-config)
* [`zapai gpt resetFiles`](#zapai-gpt-resetfiles)
* [`zapai gpt resetStore`](#zapai-gpt-resetstore)
* [`zapai gpt upload PATTERN`](#zapai-gpt-upload-pattern)
* [`zapai grok BaseGrokCommand`](#zapai-grok-basegrokcommand)
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

## `zapai grok BaseGrokCommand`

```
USAGE
  $ zapai grok BaseGrokCommand
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
  z grok:config
```

## `zapai grok conversations`

List and select Grok conversations

```
USAGE
  $ zapai grok conversations

DESCRIPTION
  List and select Grok conversations

EXAMPLES
  z grok:conversations
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
