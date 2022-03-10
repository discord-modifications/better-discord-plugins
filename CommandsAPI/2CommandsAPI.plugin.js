/**
 * @name CommandsAPI
 * @source https://github.com/discord-modifications/better-discord-plugins/blob/master/CommandsAPI/2CommandsAPI.plugin.js
 * @updateUrl https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/CommandsAPI/2CommandsAPI.plugin.js
 * @website https://github.com/discord-modifications/better-discord-plugins/tree/master/CommandsAPI/2CommandsAPI.plugin.js
 * @authorId 282595588950982656
 * @invite HQ5N7Rcajc
 * @donate https://paypal.me/eternal404
 */

/*@cc_on
@if (@_jscript)

    // Offer to self-install for clueless users that try to run this directly.
    var shell = WScript.CreateObject("WScript.Shell");
    var fs = new ActiveXObject("Scripting.FileSystemObject");
    var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
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
               github_username: 'eternal404'
            }
         ],
         version: '1.1.7',
         description: 'Adds a command system to BetterDiscord for other plugins to utilize..',
         github: 'https://github.com/eternal404',
         github_raw: 'https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/CommandsAPI/2CommandsAPI.plugin.js'
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
            note: "Replaces Clyde in commands with a mixed range of avatars and usernames selected by plug-in developers - fallbacks to 'Commands' by default.",
            id: 'replaceClyde',
            type: 'switch',
            value: true
         }
      ],
      changelog: [
         {
            title: 'Fixed',
            type: 'fixed',
            items: ['Fixed canary crashes']
         }
      ]
   };

   return !global.ZeresPluginLibrary ? class {
      constructor() {
         this.start = this.load = this.handleMissingLib;
      }

      getName() {
         return config.info.name.replace(/\s+/g, '');
      }

      getAuthor() {
         return config.info.authors.map(a => a.name).join(', ');
      }

      getVersion() {
         return config.info.version;
      }

      getDescription() {
         return config.info.description + ' You are missing libraries for this plugin, please enable the plugin and click Download Now.';
      }

      start() { }

      stop() { }

      async handleMissingLib() {
         const request = require('request');
         const path = require('path');
         const fs = require('fs');

         const dependencies = [
            {
               global: 'ZeresPluginLibrary',
               filename: '0PluginLibrary.plugin.js',
               external: 'https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js',
               url: 'https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js'
            }
         ];

         if (!dependencies.map(d => window.hasOwnProperty(d.global)).includes(false)) return;

         if (global.eternalModal) {
            while (global.eternalModal && dependencies.map(d => window.hasOwnProperty(d.global)).includes(false)) await new Promise(f => setTimeout(f, 1000));
            if (!dependencies.map(d => window.hasOwnProperty(d.global)).includes(false)) return BdApi.Plugins.reload(this.getName());
         };

         global.eternalModal = true;

         BdApi.showConfirmationModal(
            'Dependencies needed',
            `Dependencies needed for ${this.getName()} are missing. Please click download to install the dependecies.`,
            {
               confirmText: 'Download',
               cancelText: 'Cancel',
               onCancel: () => delete global.eternalModal,
               onConfirm: async () => {
                  for (const dependency of dependencies) {
                     if (!window.hasOwnProperty(dependency.global)) {
                        await new Promise((resolve) => {
                           request.get(dependency.url, (error, res, body) => {
                              if (error) return electron.shell.openExternal(dependency.external);
                              fs.writeFile(path.join(BdApi.Plugins.folder, dependency.filename), body, resolve);
                           });
                        });
                     }
                  }

                  delete global.eternalModal;
               }
            }
         );
      }
   } : (([Plugin, API]) => {
      const {
         PluginUtilities,
         WebpackModules,
         Patcher,
         DiscordModules: { React }
      } = API;
      const { Messages } = WebpackModules.find(m => m.Messages?.ACCOUNT);

      return class extends Plugin {
         constructor() {
            super();
         }

         async load() {
            super.load();

            const path = require('path');
            this.changeName(path.join(__dirname, path.basename(__filename)), '2CommandsAPI');

            const settings = this.settings = PluginUtilities.loadSettings(this.getName(), {
               prefix: '-',
               replaceClyde: true
            });

            window.CommandsAPI = new class API {
               get prefix() {
                  return settings.prefix;
               }

               get find() {
                  const arr = Object.values(window.commands || {});
                  return arr.find.bind(arr);
               }

               get filter() {
                  const arr = Object.values(window.commands || {});
                  return arr.filter.bind(arr);
               }

               get map() {
                  const arr = Object.values(window.commands || {});
                  return arr.map.bind(arr);
               }

               get sort() {
                  const arr = Object.values(window.commands || {});
                  return arr.sort.bind(arr);
               }
            }();

            this.patchMessages();
            this.patchAutocomplete();
            this.registerDefaults();
         };

         unload() {
            delete window.CommandsAPI;
            for (const cmd of ['echo', 'help', 'say']) {
               delete window.commands[cmd];
            }
            Patcher.unpatchAll();
         };

         getSettingsPanel() {
            return this.buildSettingsPanel().getElement();
         }

         async patchMessages() {
            const messages = WebpackModules.getByProps('sendMessage', 'editMessage');
            const { BOT_AVATARS } = WebpackModules.getByProps('BOT_AVATARS');
            const { createBotMessage } = WebpackModules.getByProps('createBotMessage');
            const { getChannelId } = WebpackModules.getByProps('getLastSelectedChannelId');

            BOT_AVATARS.CommandsAPI = 'http://github.com/BetterDiscord.png';

            messages.sendMessage = (sendMessage => async (id, message, ...params) => {
               if (!message.content.startsWith(window.CommandsAPI.prefix)) {
                  return sendMessage(id, message, ...params).catch(() => void 0);
               }

               const [cmd, ...args] = message.content.slice(window.CommandsAPI.prefix.length).split(' ');
               const command = window.CommandsAPI.find(c => [c.command.toLowerCase(), ...(c.aliases?.map(alias => alias.toLowerCase()) || [])].includes(cmd.toLowerCase()));
               if (!command) {
                  return sendMessage(id, message, ...params).catch(() => void 0);
               }

               let result;
               try {
                  result = await command.executor(args, this);
               } catch (e) {
                  result = {
                     send: false,
                     result: [
                        `An error occurred while executing the command: ${e.message}.`,
                        'Check the console for more details.'
                     ].join('\n')
                  };
                  console.error('An error occurred while executing command %s: %o', command.command, e);
               }

               if (!result) return;

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

         async patchAutocomplete() {
            const {
               AUTOCOMPLETE_OPTIONS: AutocompleteTypes,
               AUTOCOMPLETE_PRIORITY: AutocompletePriority
            } = WebpackModules.getByProps('AUTOCOMPLETE_OPTIONS');

            const Scroller = WebpackModules.getByDisplayName('AdvancedScrollerThin');
            const messages = WebpackModules.getByProps('sendMessage', 'editMessage');
            const Autocomplete = WebpackModules.getByDisplayName('Autocomplete');
            const Text = WebpackModules.getByDisplayName('Text');
            const _this = this;

            class Title extends Autocomplete.Title {
               render() {
                  const res = super.render();
                  if (!this.props.title[0]) {
                     res.props.children = null;
                     res.props.style = { padding: '4px' };
                  }

                  return res;
               }
            };

            class Command extends Autocomplete.Command {
               renderContent() {
                  const res = super.renderContent();
                  res.props.children[0] = React.createElement(Text, {
                     children: this.props.prefix ? this.props.prefix : window.CommandsAPI.prefix,
                     style: {
                        color: 'var(--text-muted)',
                        marginRight: 2.5
                     }
                  });

                  return res;
               }
            };

            function renderHeader(value, formatHeader, customHeader) {
               const title = value.length > 0 ? Messages.COMMANDS_MATCHING.format({ prefix: formatHeader(value) }) : Messages.COMMANDS;

               return React.createElement(Title, { title: customHeader || ['BetterDiscord ', title] }, 'autocomplete-title-Commands');
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
                  ? React.createElement(Scroller, { style: { height: '337px' } }, results)
                  : results
               );
            }

            function getMatchingCommand(c) {
               return [c.command.toLowerCase(), ...(c.aliases?.map(alias => alias.toLowerCase()) || [])];
            }

            if (!AutocompletePriority.includes('BETTERDISCORD')) {
               AutocompletePriority.unshift('BETTERDISCORD');
               AutocompletePriority.unshift('BETTERDISCORD_AUTOCOMPLETE');
            }

            AutocompleteTypes.BETTERDISCORD_AUTOCOMPLETE = {
               get sentintel() { return window.CommandsAPI.prefix; },
               matches: (_channel, _guild, value, start) => start && value.includes(' ') && window.CommandsAPI.find(c => (getMatchingCommand(c)).includes(value.split(' ')[0])),
               queryResults: (_channel, _guild, value) => {
                  const currentCommand = window.CommandsAPI.find(c => (getMatchingCommand(c)).includes(value.split(' ')[0]));
                  if (currentCommand.autocomplete) {
                     const autocompleteRows = currentCommand.autocomplete(value.split(' ').slice(1));
                     if (autocompleteRows) {
                        autocompleteRows.value = value;
                        autocompleteRows.commands.__header = [autocompleteRows.header];
                        delete autocompleteRows.header;
                     }
                     return { results: autocompleteRows };
                  }

                  return { results: {} };
               },
               renderResults: (result, selected, _channel, _guild, value, _props, onHover, onClick) => {
                  if (result && result.commands) {
                     const { commands } = result;
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
               onSelect: (result, selected, isEnter, props) => {
                  if (result.commands[selected].instruction) {
                     if (isEnter) {
                        const msg = `${window.CommandsAPI.prefix}${result.value}`;
                        messages.sendMessage('0', { content: msg });
                        this.instance.clearValue();
                     } else if (!result.value.endsWith(' ')) {
                        props.insertText(`${window.CommandsAPI.prefix}${result.value}`);
                     }

                     return {};
                  }
                  const value = result.value.split(' ').slice(0, -1).join(' ');
                  props.insertText(`${window.CommandsAPI.prefix}${value} ${result.commands[selected].command}`);
                  return {};
               }
            };

            AutocompleteTypes.BETTERDISCORD = {
               get sentinel() { return window.CommandsAPI.prefix; },
               matches: (_channel, _guild, value, start) => start && window.CommandsAPI.filter(c => (getMatchingCommand(c)).some(commandName => commandName.includes(value))).length,
               queryResults: (_channel, _guild, value) => ({
                  results: {
                     commands: window.CommandsAPI.filter(c => (getMatchingCommand(c)).some(commandName => commandName.includes(value)))
                  }
               }),
               renderResults: (result, selected, _channel, _guild, value, _props, onHover, onClick) => {
                  if (result && result.commands) {
                     return renderCommandResults(value, selected, result.commands, onHover, onClick, c => ({
                        key: `betterdiscord-${c.command}`,
                        command: {
                           name: c.command,
                           ...c
                        }
                     }), (value) => `${window.CommandsAPI.prefix}${value}`);
                  }
               },
               onSelect: (result, selected, _, props) => {
                  props.insertText(`${window.CommandsAPI.prefix}${result.commands[selected].command}`);
                  return {};
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
                  const currentCommand = window.CommandsAPI.find(c => (getMatchingCommand(c)).includes(textValue.slice(window.CommandsAPI.prefix.length).split(' ')[0]));
                  if (textValue.startsWith(window.CommandsAPI.prefix) && (!currentCommand || (currentCommand && !currentCommand.showTyping))) {
                     return typing.stopTyping(channel);
                  }
                  startTyping(channel);
               }
            }))(this.oldStartTyping = typing.startTyping);

            const PlainTextArea = WebpackModules.getByDisplayName('PlainTextArea');
            Patcher.after(PlainTextArea.prototype, 'getCurrentWord', function (ctx, args, res) {
               const { value } = ctx.props;
               if (new RegExp(`^\\${window.CommandsAPI.prefix}\\S+ `).test(value)) {
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
               if (new RegExp(`^\\${window.CommandsAPI.prefix}\\S+ `).test(document.text)) {
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

         registerDefaults() {
            window.commands = {
               ...(window.commands || {}),
               echo: {
                  command: 'echo',
                  description: 'Returns the specified arguments.',
                  usage: '{c} [ ...arguments ]',
                  executor: (args) => ({
                     send: false,
                     result: args.join(' ')
                  })
               },
               help: {
                  command: 'help',
                  aliases: ['h'],
                  description: 'Gives you a list of commands or information on a specific command.',
                  usage: '{c} [ commandName ]',
                  executor([commandName]) {
                     let result;

                     if (!commandName) {
                        const getPropLength = (command) => command.command.length;

                        const longestCommandName = getPropLength(
                           window.CommandsAPI.sort((a, b) => getPropLength(b) - getPropLength(a))[0]
                        );

                        result = {
                           type: 'rich',
                           title: 'List of Commands',
                           description: window.CommandsAPI
                              .map(({ command, description }) =>
                                 `\`${command.padEnd((longestCommandName * 2) - command.length, ' \u200b')} |\` \u200b \u200b*${description}*`
                              )
                              .join('\n'),
                           footer: {
                              text: `Run ${window.CommandsAPI.prefix}help <commandName> for more information regarding a specific command.`
                           }
                        };
                     } else {
                        const command = window.CommandsAPI.find(c => [c.command, ...(c.aliases || [])].includes(commandName));
                        if (!command) {
                           result = `Command \`${commandName}\` not found.`;
                        } else {
                           result = {
                              type: 'rich',
                              title: `Help for ${commandName}`,
                              description: command.description,
                              fields: [{
                                 name: 'Usage',
                                 value: `\`${command.usage.replace('{c}', window.CommandsAPI.prefix + command.command)}\n\``,
                                 inline: false
                              }]
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
                        commands: window.CommandsAPI.filter(command =>
                           [command.command, ...(command.aliases || [])].some(commandName =>
                              commandName.includes(args[0])
                           )
                        ),
                        header: 'Command List'
                     };
                  }
               },
               say: {
                  command: 'say',
                  description: 'Sends the specified arguments.',
                  usage: '{c} [ ...arguments ]',
                  showTyping: true,
                  executor: (args) => ({
                     send: true,
                     result: args.join(' ')
                  })
               }
            };
         }

         changeName(currentName, newName) {
            try {
               const path = require('path');
               const fs = require('fs');
               const pluginsFolder = path.dirname(currentName);
               const pluginName = path.basename(currentName).match(/^[^\.]+/)[0];
               if (pluginName === newName) return true;
               const wasEnabled = BdApi.Plugins && BdApi.Plugins.isEnabled ? BdApi.Plugins.isEnabled(pluginName) : global.pluginCookie && pluginCookie[pluginName];
               fs.accessSync(currentName, fs.constants.W_OK | fs.constants.R_OK);
               const files = fs.readdirSync(pluginsFolder);
               files.forEach(file => {
                  if (!file.startsWith(pluginName) || file.startsWith(newName) || file.indexOf('.plugin.js') !== -1) return;
                  fs.renameSync(path.resolve(pluginsFolder, file), path.resolve(pluginsFolder, `${newName}${file.match(new RegExp(`^${pluginName}(.*)`))[1]}`));
               });
               fs.renameSync(currentName, path.resolve(pluginsFolder, `${newName}.plugin.js`));
               if (!wasEnabled) return;
               setTimeout(() => (BdApi.Plugins && BdApi.Plugins.enable ? BdApi.Plugins.enable(newName) : pluginModule.enablePlugin(newName)), 1000); /* /shrug */
            } catch (e) { }
         }
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/
