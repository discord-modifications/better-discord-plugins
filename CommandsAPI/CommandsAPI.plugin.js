/**
 * @name CommandsAPI
 * @source https://github.com/slow/better-discord-plugins/blob/master/CommandsAPI/CommandsAPI.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/CommandsAPI/CommandsAPI.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/CommandsAPI/CommandsAPI.plugin.js
 * @authorId 282595588950982656
 * @donate https://paypal.me/eternal404
 */

/*@cc_on
@if (@_jscript)
	
  // Offer to self-install for clueless users that try to run this directly.
  var shell = WScript.CreateObject("WScript.Shell");
  var fs = new ActiveXObject("Scripting.FileSystemObject");
  var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
  var pathSelf = WScript.ScriptFullName;
  // Put the user at ease by addressing them in the first person
  shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
  if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
     shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
  } else if (!fs.FolderExists(pathPlugins)) {
     shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
  } else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
     fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
     // Show the user where to put plugins in the future
     shell.Exec("explorer " + pathPlugins);
     shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
  }
  WScript.Quit();

@else@*/

module.exports = (() => {
   const config = {
      info: {
         name: 'CommandsAPI',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
            }
         ],
         version: '1.0.3',
         description: 'Adds a command system to BetterDiscord for other plugins to utilize.',
         github: 'https://github.com/slow/better-discord-plugins/tree/master/CommandsAPI/CommandsAPI.plugin.js',
         github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/CommandsAPI/CommandsAPI.plugin.js',
      },
      defaultConfig: [
         {
            name: 'Prefix',
            note: 'Command Prefix',
            id: 'prefix',
            type: 'textbox',
            value: '-'
         },
         {
            name: 'Eradicate Clyde',
            note: 'Replaces Clyde in commands with a mixed range of avatars and usernames selected by plug-in developers - fallbacks to \"Commands\" by default.',
            id: 'replaceClyde',
            type: 'switch',
            value: true
         }
      ]
   };

   return !global.ZeresPluginLibrary ? class {
      getName() {
         return config.info.name;
      }

      getAuthor() {
         return config.info.authors[0].name;
      }

      getVersion() {
         return config.info.version;
      }

      getDescription() {
         return config.info.description;
      }

      load() {
         BdApi.showConfirmationModal('Library Missing', `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
            confirmText: 'Download Now',
            cancelText: 'Cancel',
            onConfirm: () => {
               require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (error, response, body) => {
                  if (error) return require('electron').shell.openExternal('https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js');
                  await new Promise(r => require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, r));
               });
            }
         });
      }

      start() { }

      stop() { }
   } : (([Plugin, Library]) => {
      const {
         PluginUtilities,
         WebpackModules,
         Patcher,
         DiscordModules: { React },
         ReactTools
      } = Library;
      const { Messages } = WebpackModules.getByProps('Messages', 'languages');

      return class CommandsAPI extends Plugin {
         constructor() {
            super();
         }

         async load() {
            const settings = this.settings = PluginUtilities.loadSettings(this.name, {
               prefix: '-',
               replaceClyde: true
            });
            window.commands = new class API {
               constructor() {
                  this.commands = {};
               }

               get prefix() {
                  return settings.prefix;
               }

               get find() {
                  const arr = Object.values(this.commands);
                  return arr.find.bind(arr);
               }

               get filter() {
                  const arr = Object.values(this.commands);
                  return arr.filter.bind(arr);
               }

               get map() {
                  const arr = Object.values(this.commands);
                  return arr.map.bind(arr);
               }

               get sort() {
                  const arr = Object.values(this.commands);
                  return arr.sort.bind(arr);
               }

               register(command) {
                  const stackTrace = (new Error()).stack;
                  const [, origin] = stackTrace.match(new RegExp(`${global._.escapeRegExp(BdApi.Plugins.folder)}.([-\\w]+)`));

                  if (typeof command === 'string') return;

                  if (this.commands[command.command]) {
                     throw new Error(`Command ${command.command} is already registered!`);
                  }

                  this.commands[command.command] = {
                     ...command,
                     origin
                  };
               }

               unregister(command) {
                  if (this.commands[command]) {
                     delete this.commands[command];
                  }
               }
            }();
            await this.patchMessages();
            await this.patchAutocomplete();
            await this.registerDefaults();
         }

         getSettingsPanel() {
            return this.buildSettingsPanel().getElement();
         }

         start() {
            console.log(this);
         }

         stop() { }

         unload() {
            delete window.commands;
            Patcher.unpatchAll();
         }

         async registerDefaults() {
            let defaults = [
               {
                  command: 'echo',
                  description: 'Returns the specified arguments.',
                  usage: '{c} [ ...arguments ]',
                  executor: (args) => ({
                     send: false,
                     result: args.join(' ')
                  })
               },
               {
                  command: 'help',
                  aliases: ['h'],
                  description: 'Gives you a list of commands or information on a specific command.',
                  usage: '{c} [ commandName ]',
                  executor([commandName]) {
                     let result;

                     if (!commandName) {
                        const getPropLength = (command) => command.command.length;

                        const longestCommandName = getPropLength(
                           window.commands.sort((a, b) => getPropLength(b) - getPropLength(a))[0]
                        );

                        result = {
                           type: 'rich',
                           title: 'List of Commands',
                           description: window.commands
                              .map(({ command, description }) =>
                                 `\`${command.padEnd((longestCommandName * 2) - command.length, ' \u200b')} |\` \u200b \u200b*${description}*`
                              )
                              .join('\n'),
                           footer: {
                              text: `Run ${window.commands.prefix}help <commandName> for more information regarding a specific command.`
                           }
                        };
                     } else {
                        const command = window.commands.find(c => [c.command, ...(c.aliases || [])].includes(commandName));
                        if (!command) {
                           result = `Command \`${commandName}\` not found.`;
                        } else {
                           result = {
                              type: 'rich',
                              title: `Help for ${commandName}`,
                              description: command.description,
                              fields: [{
                                 name: 'Usage',
                                 value: `\`${command.usage.replace('{c}', window.commands.prefix + command.command)}\n\``,
                                 inline: false
                              }],
                              footer: {
                                 text: `Inherited from "${command.origin}".`
                              }
                           };
                        }
                     }

                     return {
                        send: false,
                        result
                     };
                  },
                  autocomplete(args) {
                     if (args.length > 1) {
                        return false;
                     }

                     return {
                        commands: window.commands.filter(command =>
                           [command.command, ...(command.aliases || [])].some(commandName =>
                              commandName.includes(args[0])
                           )
                        ),
                        header: 'Command List'
                     };
                  }
               },
               {
                  command: 'say',
                  description: 'Sends the specified arguments.',
                  usage: '{c} [ ...arguments ]',
                  showTyping: true,
                  executor: (args) => ({
                     send: true,
                     result: args.join(' ')
                  })
               }
            ];

            for (const command of defaults) {
               commands.register(command);
            }
         }

         async patchMessages() {
            const messages = WebpackModules.getByProps('sendMessage', 'editMessage');
            const { BOT_AVATARS } = WebpackModules.getByProps('BOT_AVATARS');
            const { createBotMessage } = WebpackModules.getByProps('createBotMessage');
            const { getChannelId } = WebpackModules.getByProps('getChannelId');

            BOT_AVATARS.CommandsAPI = 'https://cdn.discordapp.com/icons/86004744966914048/babd1af3fa6011a50e418a80f4970ceb.png?size=2048';

            messages.sendMessage = (sendMessage => async (id, message, ...params) => {
               if (!message.content.startsWith(window.commands.prefix)) {
                  return sendMessage(id, message, ...params).catch(() => void 0);
               }

               const [cmd, ...args] = message.content.slice(window.commands.prefix.length).split(' ');
               const command = window.commands.find(c => [c.command.toLowerCase(), ...(c.aliases?.map(alias => alias.toLowerCase()) || [])].includes(cmd.toLowerCase()));
               if (!command) {
                  return sendMessage(id, message, ...params).catch(() => void 0);
               }

               const result = await command.executor(args, this);
               if (!result) {
                  return;
               }

               if (result.send) {
                  message.content = result.result;
               } else {
                  const receivedMessage = createBotMessage(getChannelId(), '');

                  if (this.settings.replaceClyde) {
                     receivedMessage.author.username = result.username || 'Commands';
                     receivedMessage.author.avatar = result.avatar || 'CommandsAPI';

                     if (result.avatar_url) {
                        BOT_AVATARS[result.username] = result.avatar_url;
                        receivedMessage.author.avatar = result.username;
                     }
                  }

                  if (typeof result.result === 'string') {
                     receivedMessage.content = result.result;
                  } else {
                     receivedMessage.embeds.push(result.result);
                  }

                  return (messages.receiveMessage(receivedMessage.channel_id, receivedMessage), delete BOT_AVATARS[result.avatar_url]);
               }

               return sendMessage(id, message, ...params).catch(() => void 0);
            })(this.oldSendMessage = messages.sendMessage);
         }

         getAsyncComponent(component) {
            class AsyncComponent extends React.PureComponent {
               constructor(props) {
                  super(props);
                  this.state = {
                     Component: null
                  };
               }

               async componentDidMount() {
                  this.setState({
                     Component: await this.props._provider()
                  });
               }

               render() {
                  const { Component } = this.state;
                  if (Component) {
                     return React.createElement(Component, Object.assign({}, this.props, this.props._pass));
                  }
                  return this.props._fallback || null;
               }

               static from(promise, fallback) {
                  return React.memo(
                     (props) => React.createElement(AsyncComponent, {
                        _provider: () => promise,
                        _fallback: fallback,
                        ...props
                     })
                  );
               }
            }

            return AsyncComponent.from(component);
         }

         async patchAutocomplete() {
            const _this = this;
            this.classes = {
               ...WebpackModules.getByProps('channelTextArea', 'inner')
            };
            const Autocomplete = WebpackModules.getByDisplayName('Autocomplete');
            const Text = _this.getAsyncComponent('Text');

            class Title extends Autocomplete.Title {
               render() {
                  const res = super.render();
                  if (!this.props.title[0]) {
                     res.props.children = null;
                     res.props.style = { padding: '4px' };
                  }

                  return res;
               }
            }

            class Command extends Autocomplete.Command {
               renderContent() {
                  const res = super.renderContent();
                  res.props.children[0] = React.createElement(Text, {
                     children: this.props.prefix ? this.props.prefix : window.commands.prefix,
                     style: {
                        color: 'var(--text-muted)',
                        marginRight: 2.5
                     }
                  });

                  return res;
               }
            }

            function renderHeader(value, formatHeader, customHeader) {
               const title = value.length > 0 ? Messages.COMMANDS_MATCHING.format({ prefix: formatHeader(value) }) : Messages.COMMANDS;

               return React.createElement(Title, {
                  title: customHeader || [title]
               }, 'autocomplete-title-Commands');
            }

            function renderCommandResults(value, selected, commands, onHover, onClick, formatCommand, formatHeader, customHeader) {
               if (!commands || commands.length === 0) {
                  return null;
               }

               const results = commands.map((command, index) => React.createElement(Command, Object.assign({
                  onClick,
                  onHover,
                  selected: selected === index,
                  index
               }, formatCommand(command, index))));

               return React.createElement(React.Fragment, {}, renderHeader(value, formatHeader, customHeader), results.length > 10
                  ? React.createElement(_this.getAsyncComponent(WebpackModules.getByDisplayName('AdvancedScrollerThin')), { style: { height: '337px' } }, results)
                  : results
               );
            }

            function getMatchingCommand(c) {
               return [c.command.toLowerCase(), ...(c.aliases?.map(alias => alias.toLowerCase()) || [])];
            }

            const { AUTOCOMPLETE_OPTIONS: AutocompleteTypes } = WebpackModules.getByProps('AUTOCOMPLETE_OPTIONS');
            AutocompleteTypes.BETTERDISCORD_AUTOCOMPLETE = {
               autoSelect: true,
               getSentinel: () => window.commands.prefix,
               matches: (_channel, prefix, value, isAtStart, props) => props.canExecuteCommands && isAtStart && prefix === window.commands.prefix && window.commands.filter(c => c.autocomplete).find(c => (getMatchingCommand(c)).includes(value.split(' ')[0])),
               queryResults: (_channel, value) => {
                  const currentCommand = window.commands.find(c => (getMatchingCommand(c)).includes(value.split(' ')[0]));
                  if (!currentCommand) {
                     return false;
                  }

                  if (currentCommand.autocomplete) {
                     const autocompleteRows = currentCommand.autocomplete(value.split(' ').slice(1));
                     if (autocompleteRows) {
                        autocompleteRows.commands.__header = [autocompleteRows.header];
                        delete autocompleteRows.header;
                     }
                     return autocompleteRows;
                  }
               },
               renderResults: (_channel, value, selected, onHover, onClick, _state, _props, autocomplete) => {
                  if (autocomplete && autocomplete.commands) {
                     const { commands } = autocomplete;
                     const customHeader = Array.isArray(commands.__header) ? commands.__header : [commands.__header];

                     return renderCommandResults(value, selected, commands, onHover, onClick, c => ({
                        key: `betterdiscord-${c.command}`,
                        command: {
                           name: c.command,
                           ...c
                        },
                        prefix: value.split(' ')[0]
                     }), () => void 0, customHeader);
                  }
               },
               getPlainText: (index, _state, { commands }) => {
                  let value = '';
                  const instance = ReactTools.getOwnerInstance(document.querySelector(`.${this.classes.textArea.split(' ')[0]}`));
                  const currentText = instance.getCurrentWord().word;

                  if (commands[index].wildcard) {
                     value = currentText.split(' ').pop();
                  } else if (commands[index].instruction) {
                     value = '';
                  } else {
                     value = commands[index].command;
                  }
                  const currentTextSplit = currentText.split(' ');
                  return `${currentTextSplit.slice(0, currentTextSplit.length - 1).join(' ')} ${value}`;
               },
               getRawText(...args) {
                  return this.getPlainText(...args);
               }
            };

            AutocompleteTypes.BETTERDISCORD = {
               autoSelect: true,
               getSentinel: () => window.commands.prefix,
               matches: (_channel, prefix, _value, isAtStart, props) => props.canExecuteCommands && isAtStart && prefix === window.commands.prefix,
               queryResults: (_channel, value) => ({
                  commands: window.commands.filter(c => (getMatchingCommand(c)).some(commandName => commandName.includes(value)))
               }),
               renderResults: (_channel, value, selected, onHover, onClick, _state, _props, autocomplete) => {
                  if (autocomplete && autocomplete.commands) {
                     return renderCommandResults(value, selected, autocomplete.commands, onHover, onClick, c => ({
                        key: `betterdiscord-${c.command}`,
                        command: {
                           name: c.command,
                           ...c
                        }
                     }), (value) => `${window.commands.prefix}${value}`);
                  }
               },
               getPlainText: (index, _state, { commands }) => commands && commands[index] ? `${window.commands.prefix}${commands[index].command}` : '',
               getRawText(...args) {
                  return this.getPlainText(...args);
               }
            };

            const ChannelEditorContainer = WebpackModules.getByDisplayName('ChannelEditorContainer');
            Patcher.after(ChannelEditorContainer.prototype, 'render', function (_, args, res) {
               _this.instance = _;
            });

            const typing = WebpackModules.getByProps('startTyping');
            typing.startTyping = (startTyping => (channel) => setImmediate(() => {
               if (this.instance && this.instance.props) {
                  const { textValue } = this.instance.props;
                  const currentCommand = window.commands.find(c => (getMatchingCommand(c)).includes(textValue.slice(window.commands.prefix.length).split(' ')[0]));
                  if (textValue.startsWith(window.commands.prefix) && (!currentCommand || (currentCommand && !currentCommand.showTyping))) {
                     return typing.stopTyping(channel);
                  }
                  startTyping(channel);
               }
            }))(this.oldStartTyping = typing.startTyping);

            const PlainTextArea = WebpackModules.getByDisplayName('PlainTextArea');
            Patcher.after(PlainTextArea.prototype, 'getCurrentWord', function (ctx, args, res) {
               const { value } = ctx.props;
               if (new RegExp(`^\\${window.commands.prefix}\\S+ `).test(value)) {
                  if ((/^@|#|:/).test(res.word)) {
                     return res;
                  }

                  return {
                     word: value,
                     isAtStart: true
                  };
               }
               return res;
            });

            const SlateChannelTextArea = WebpackModules.getByDisplayName('SlateChannelTextArea');
            Patcher.after(SlateChannelTextArea.prototype, 'getCurrentWord', function (ctx, args, res) {
               const { value } = ctx.editorRef;
               const { selection, document } = value;
               if (new RegExp(`^\\${window.commands.prefix}\\S+ `).test(document.text)) {
                  if ((/^@|#|:/).test(res.word)) {
                     return res;
                  }

                  const node = document.getNode(selection.start.key);
                  if (node) {
                     return {
                        word: node.text.substring(0, selection.start.offset),
                        isAtStart: true
                     };
                  }
               }
               return res;
            });
         }

         get [Symbol.toStringTag]() {
            return 'Plugin';
         }
         get css() {
            return this._css;
         }
         get name() {
            return config.info.name;
         }
         get short() {
            let string = '';

            for (let i = 0, len = config.info.name.length; i < len; i++) {
               const char = config.info.name[i];
               if (char === char.toUpperCase()) string += char;
            }

            return string;
         }
         get author() {
            return config.info.authors.map(author => author.name).join(', ');
         }
         get version() {
            return config.info.version;
         }
         get description() {
            return config.info.description;
         }
      };


   })(global.ZeresPluginLibrary.buildPlugin(config));
})();