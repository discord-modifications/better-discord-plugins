/**
 * @name MessageCleaner
 * @source https://github.com/discord-modifications/better-discord-plugins/blob/master/MessageCleaner/MessageCleaner.plugin.js
 * @updateUrl https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/MessageCleaner/MessageCleaner.plugin.js
 * @website https://github.com/discord-modifications/better-discord-plugins/tree/master/MessageCleaner/MessageCleaner.plugin.js
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
         name: 'MessageCleaner',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'eternal404'
            }
         ],
         version: '1.2.9',
         description: 'Clears messages in the current channel.',
         github: 'https://github.com/eternal404',
         github_raw: 'https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/MessageCleaner/MessageCleaner.plugin.js'
      },
      changelog: [
         {
            title: 'Fixed',
            type: 'fixed',
            items: [
               'Fix context menus.'
            ]
         }
      ]
   };

   return !global.ZeresPluginLibrary || !global.CommandsAPI || !global.XenoLib ? class {
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
            },
            {
               global: 'XenoLib',
               filename: '1XenoLib.plugin.js',
               external: 'https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/1XenoLib.plugin.js',
               url: 'https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/1XenoLib.plugin.js'
            },
            {
               global: 'CommandsAPI',
               filename: '2CommandsAPI.plugin.js',
               external: 'https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/CommandsAPI/2CommandsAPI.plugin.js',
               url: 'https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/CommandsAPI/2CommandsAPI.plugin.js'
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
      const { WebpackModules, DCM, Patcher, DiscordModules: { React }, Logger, PluginUtilities, Utilities } = API;
      const { getToken } = WebpackModules.getByProps('getToken');
      const { getChannelId } = WebpackModules.getByProps('getLastSelectedChannelId');
      const ChannelStore = WebpackModules.getByProps('openPrivateChannel');
      const { getChannel } = WebpackModules.getByProps('hasChannel');
      const { MenuItem, MenuSeperator } = WebpackModules.getByProps('MenuItem');
      const { getUser } = WebpackModules.getByProps('getUser');
      const { getGuild } = WebpackModules.getByProps('getGuild');
      const { getCurrentUser } = WebpackModules.getByProps('getCurrentUser', 'getUser');
      const messages = WebpackModules.getByProps('sendMessage', 'editMessage');
      const sleep = (time) => new Promise((f) => setTimeout(() => f(), time));

      const Components = (() => {
         const comps = {};

         const FormDivider = WebpackModules.getByDisplayName('FormDivider');
         comps.Divider = () => FormDivider({ style: { marginTop: '20px' } });

         const { description } = WebpackModules.getByProps('formText', 'description');
         const DFormItem = WebpackModules.getByDisplayName('FormItem');
         const FormText = WebpackModules.getByDisplayName('FormText');
         const margins = WebpackModules.getByProps('avatar', 'marginBottom20');
         const Flex = WebpackModules.getByDisplayName('Flex');

         comps.FormItem = class FormItem extends React.PureComponent {
            render() {
               const noteClasses = [description, this.props.noteHasMargin && margins.marginTop8].filter(Boolean).join(' ');
               return React.createElement(DFormItem, {
                  title: this.props.title,
                  required: this.props.required,
                  className: `${Flex.Direction.VERTICAL} ${Flex.Justify.START} ${Flex.Align.STRETCH} ${Flex.Wrap.NO_WRAP} ${margins.marginBottom20}`
               }, this.props.children, this.props.note && React.createElement(FormText, {
                  className: noteClasses
               }, this.props.note), React.createElement(comps.Divider, null));
            };
         };

         const DRadioGroup = WebpackModules.getByDisplayName('RadioGroup');

         comps.RadioGroup = class RadioGroup extends React.PureComponent {
            render() {
               const { children: title, note, required } = this.props;

               return React.createElement(comps.FormItem, {
                  title: title,
                  note: note,
                  required: required
               }, React.createElement(DRadioGroup, this.props));
            }
         };

         const Slider = WebpackModules.getByDisplayName('Slider');
         comps.SliderInput = class SliderInput extends React.PureComponent {
            render() {
               const { children: title, note, required } = this.props;
               delete this.props.children;

               return React.createElement(comps.FormItem, {
                  title: title,
                  note: note,
                  required: required
               }, React.createElement(Slider, {
                  ...this.props,
                  className: `${this.props.className || ''} ${margins.marginTop20}`.trim()
               }));
            };
         };

         return comps;
      })();

      const settings = PluginUtilities.loadSettings(config.info.name, {
         mode: 0,
         normalDelay: 150,
         burstDelay: 1000,
         chunkSize: 3
      });

      return class extends Plugin {
         constructor() {
            super();

            this.pruning = {};
         }

         start() {
            if (!window.commands) window.commands = {};
            if (!window.commands['clear']) {
               window.commands['clear'] = {
                  command: 'clear',
                  aliases: ['cl'],
                  description: 'Clears a certain amount of messages.',
                  usage: '{c} (amount) [beforeMessageId]',
                  executor: (args) => this.clear(args)
               };
            }

            this.promises = { cancelled: false };

            this.patchContextMenus();
         };

         async patchContextMenus() {
            this.patchGuildContextMenu();
            this.patchChannelsContextMenu();
         }

         async patchChannelsContextMenu() {
            const GroupDMContextMenu = WebpackModules.find(m => m.default?.toString()?.includes?.('mute-channel'));
            if (this.promises.cancelled) return;
            Patcher.after(GroupDMContextMenu, 'default', this.processContextMenu.bind(this));
         }

         async patchGuildContextMenu() {
            const GuildContextMenu = await DCM.getDiscordMenu('GuildContextMenu');
            if (this.promises.cancelled) return;

            Patcher.after(GuildContextMenu, 'default', this.processContextMenu.bind(this));
         }

         processContextMenu(_, args, res) {
            if (args.length === 1 && args[0].type !== void 0) {
               const button = (!this.pruning[args[0].id] ?
                  React.createElement(MenuItem, {
                     id: 'clean-all',
                     key: 'clean-all',
                     label: 'Purge all messages',
                     action: () => this.clear(['all'], null, args[0].id, false)
                  })
                  :
                  React.createElement(MenuItem, {
                     id: 'stop-cleaning',
                     key: 'stop-cleaning',
                     label: 'Stop purging',
                     action: () => delete this.pruning[args[0].id]
                  })
               );

               return [
                  res,
                  MenuSeperator,
                  button,
               ];
            };

            const channel = args[0].channel?.id;
            const children = Utilities.findInReactTree(res, r => Array.isArray(r));
            const instance = args[0].channel?.id ?? args[0].guild?.id;
            if (!instance) return res;

            const mute = Utilities.findInReactTree(children, (c) => {
               const children = c?.props?.children;
               if (!children || (Array.isArray(children) && !children.length)) return false;

               const items = [
                  'unmute-channel',
                  'unmute-guild',
                  'mute-channel',
                  'mute-guild'
               ];

               if (children.length) {
                  return children.find(child => items.includes(child?.props?.id));
               } else {
                  return items.includes(children.props?.id);
               }
            });

            const old = mute?.props?.children;
            if (mute && old) {
               const button = (!this.pruning[instance] ?
                  React.createElement(MenuItem, {
                     id: 'clean-all',
                     key: 'clean-all',
                     label: 'Purge all messages',
                     action: () => this.clear(['all'], null, instance, !channel)
                  })
                  :
                  React.createElement(MenuItem, {
                     id: 'stop-cleaning',
                     key: 'stop-cleaning',
                     label: 'Stop purging',
                     action: () => delete this.pruning[instance]
                  })
               );


               mute.props.children = [old, button];
            }

            return res;
         }

         stop() {
            delete window.commands?.['clear'];
            Patcher.unpatchAll();
            this.promises.cancelled = true;
         };

         getSettingsPanel() {
            return class Settings extends React.Component {
               constructor() {
                  super();
                  this.state = {
                     editError: null,
                     delayExpanded: false
                  };
               }

               renderBurst() {
                  return React.createElement("div", null, React.createElement(Components.SliderInput, {
                     minValue: 1,
                     maxValue: 10,
                     stickToMarkers: true,
                     markers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                     defaultValue: 3,
                     initialValue: settings.chunkSize,
                     onValueChange: val => {
                        settings.chunkSize = Math.floor(parseInt(val));
                        PluginUtilities.saveSettings(config.info.name, settings);
                        this.forceUpdate();
                     },
                     note: "Collection size of burst deletion chunks",
                     onMarkerRender: v => `x${v}`
                  }, "Chunk Size"), React.createElement(Components.SliderInput, {
                     minValue: 500,
                     maxValue: 1500,
                     stickToMarkers: true,
                     markers: [500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500],
                     defaultValue: 1000,
                     initialValue: settings.burstDelay,
                     onValueChange: val => {
                        settings.burstDelay = Math.floor(parseInt(val));
                        PluginUtilities.saveSettings(config.info.name, settings);
                        this.forceUpdate();
                     },
                     note: "Delay between deleting chunks",
                     onMarkerRender: v => `${Math.floor(v / 1000 * 100) / 100}s`
                  }, "Burst Delay"));
               }

               renderNormal() {
                  return React.createElement("div", null, React.createElement(Components.SliderInput, {
                     minValue: 100,
                     maxValue: 500,
                     stickToMarkers: true,
                     markers: [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200],
                     defaultValue: 150,
                     initialValue: settings.normalDelay,
                     onValueChange: val => {
                        settings.normalDelay = Math.floor(parseInt(val));
                        PluginUtilities.saveSettings(config.info.name, settings);
                        this.forceUpdate();
                     },
                     note: "Delay between deleting messages",
                     onMarkerRender: v => `${Math.floor(v)}ms`
                  }, "Delete Delay"));
               }

               render() {
                  return React.createElement("div", null, React.createElement(Components.RadioGroup, {
                     value: settings.mode,
                     onChange: v => {
                        settings.mode = v.value;
                        PluginUtilities.saveSettings(config.info.name, settings);
                        this.forceUpdate();
                     },
                     options: [
                        {
                           name: 'Normal: Deletes one message at a time (most stable but eternal404er)',
                           value: 0
                        }, {
                           name: 'Burst: Deletes multiple messages at a time (unstable but fast)',
                           value: 1
                        }
                     ]
                  }, "Deletion Mode"), settings.mode == 1 ? this.renderBurst() : this.renderNormal());
               }
            };
         }

         async clear(args, _, channel, guild = false) {
            channel = channel ? channel : getChannelId();

            const { BOT_AVATARS } = WebpackModules.getByProps('BOT_AVATARS');
            const { createBotMessage } = WebpackModules.getByProps('createBotMessage');

            const receivedMessage = createBotMessage(channel, {});
            BOT_AVATARS.message_cleaner = 'https://i.imgur.com/dOe7F3y.png';
            receivedMessage.author.username = 'Message Cleaner';
            receivedMessage.author.avatar = 'message_cleaner';

            if (args.length === 0) {
               receivedMessage.content = 'Please specify an amount.';
               return messages.receiveMessage(receivedMessage.channel_id, receivedMessage);
            }

            if (this.pruning[channel] == true && args[0]?.toLowerCase() !== 'stop') {
               receivedMessage.content = `Already pruning in this channel.`;
               return messages.receiveMessage(receivedMessage.channel_id, receivedMessage);
            }

            if (args[0]?.toLowerCase() === 'stop') {
               delete this.pruning[channel];
               receivedMessage.content = `Stopped pruning.`;
               return messages.receiveMessage(receivedMessage.channel_id, receivedMessage);
            }

            let count = args.shift();
            let before = args.shift();

            if (count !== 'all') {
               count = parseInt(count);
            }

            if (count <= 0 || count == NaN) {
               receivedMessage.content = 'Amount must be specified.';
               return messages.receiveMessage(receivedMessage.channel_id, receivedMessage);
            }

            this.pruning[channel] = true;

            receivedMessage.content = `Started clearing.`;
            messages.receiveMessage(receivedMessage.channel_id, receivedMessage);

            let amount = settings.mode ? await this.burstDelete(count, before, channel, guild) : await this.normalDelete(count, before, channel, guild);

            delete this.pruning[channel];

            if (amount !== 0) {
               let location = channel;
               let instance = guild ? getGuild(location) : await getChannel(location);
               if (guild) {
                  location = `in ${instance.name}`;
               } else if (instance.type == 0) {
                  let guild = getGuild(instance.guild_id);
                  location = `in ${guild.name} > <#${instance.id}>`;
               } else if (instance.type == 1) {
                  let user = await getUser(instance.recipients[0]);
                  location = `in DMs with <@${user.id}>`;
               } else if (instance.type == 3) {
                  if (instance.name.length == 0) {
                     let users = [];
                     for (let user of instance.recipients) {
                        user = await getUser(user);
                        users.push(user);
                     }
                     location = `in group with ${users.map(u => `<@${u.id}>`).join(', ')}`;
                  } else {
                     location = `in group ${instance.name}`;
                  }
               }

               XenoLib.Notifications.success(`Deleted ${amount} messages ${location}`, {
                  timeout: 0,
                  onClick: () => {
                     if (guild) return ZLibrary.DiscordModules.NavigationUtils.transitionTo(Routes.CHANNEL(instance.id, getChannelId(instance.id)));
                     if (instance.type == 1) return ChannelStore.openPrivateChannel(instance.recipients[0]);
                     ZLibrary.DiscordModules.NavigationUtils.transitionTo(`/channels/${instance.guild_id || '@me'}/${instance.id}`);
                  }
               });

               receivedMessage.content = `Cleared ${amount} messages.`;
            } else {
               receivedMessage.content = `No messages found.`;
            }

            return messages.receiveMessage(receivedMessage.channel_id, receivedMessage);
         }


         async normalDelete(count, before, channel, guild) {
            let deleted = 0;
            let offset = 0;
            while (count == 'all' || count > deleted) {
               if ((count !== 'all' && count === deleted) || !this.pruning[channel]) break;
               let get = await this.fetch(channel, getCurrentUser().id, before, offset, guild);
               if (get.messages.length <= 0 && get.skipped == 0) break;
               offset = get.offset;
               while (count !== 'all' && count < get.messages.length) get.messages.pop();
               for (const msg of get.messages) {
                  if (!this.pruning[channel]) break;
                  deleted += await this.deleteMsg(msg.id, msg.channel_id);
                  await sleep(settings.normalDelay);
               }
            }
            return deleted;
         }

         async burstDelete(count, before, channel, guild) {
            let deleted = 0;
            let offset = 0;
            while (count == 'all' || count > deleted) {
               if (count !== 'all' && count === deleted) break;
               let get = await this.fetch(channel, getCurrentUser().id, before, offset);
               if (get.messages.length <= 0 && get.skipped == 0) break;
               offset = get.offset;
               while (count !== 'all' && count < get.messages.length) get.messages.pop();
               let chunk = this.chunk(get.messages, settings.chunkSize);
               for (const msgs of chunk) {
                  let funcs = [];
                  for (const msg of msgs) {
                     funcs.push(async () => {
                        return await this.deleteMsg(msg.id, channel);
                     });
                  }

                  await Promise.allSettled(
                     funcs.map((f) => {
                        if (this.pruning[channel]) {
                           return f().then((amount) => {
                              deleted += amount;
                           });
                        }
                     })
                  );

                  if (this.pruning[channel]) await sleep(settings.burstDelay);
               }
            }

            return deleted;
         }

         async deleteMsg(id, channel) {
            let del = await fetch(
               `https://discord.com/api/v6/channels/${channel}/messages/${id}`,
               {
                  method: 'DELETE',
                  headers: {
                     'Authorization': getToken(),
                     'User-Agent': navigator.userAgent
                  }
               }
            );
            let deled = await del.json().catch(() => { return {}; });
            switch (del.status) {
               case 204:
                  return 1;
               case 404:
                  Logger.err(this.getName(), `Can't delete ${id} (Already deleted?)`);
               case 429:
                  Logger.err(this.getName(), `Ratelimited while deleting ${id}. Waiting ${deled.retry_after}ms`);
                  await sleep(deled.retry_after);
                  return await this.deleteMsg(id, channel);
               default:
                  Logger.err(this.getName(), `Can't delete ${id} (Response: ${del.status} | ${deled})`);
            }

            return 0;
         }

         async fetch(channel, user, before, offset, guild = false) {
            let out = [];
            let url = `https://discord.com/api/v9/${guild ?
               'guilds' :
               'channels'
               }/${channel}/messages/search?author_id=${user}${before ?
                  `&max_id=${before}` :
                  ''
               }${offset > 0 ?
                  `&offset=${offset}` :
                  ''
               }`;
            let get = await fetch(url, {
               headers: {
                  'Authorization': getToken(),
                  'User-Agent': navigator.userAgent
               }
            }
            );
            let messages = await get.json();
            switch (get.status) {
               case 200:
               case 202:
                  break;
               case 429:
                  Logger.err(this.getName(), `Ratelimited while fetching. Waiting ${messages.retry_after}ms`);
                  await sleep(messages.retry_after);
                  return this.fetch(channel, user, before, offset);
               default:
                  Logger.err(this.getName(), `Couldn't fetch (Response: ${get.status} | ${messages})`);
                  break;
            }
            if (messages.message && messages.message.startsWith('Index')) {
               await sleep(messages.retry_after);
               return this.fetch(channel, user, before, offset);
            }

            let msgs = messages.messages;
            if (!msgs.length) {
               return {
                  messages: [],
                  offset: offset,
                  skipped: 0
               };
            }

            let skippedMsgs = 0;
            for (let bulk of msgs) {
               bulk = bulk.filter((msg) => msg.hit == true);
               out.push(...bulk.filter((msg) => msg.type === 0 || msg.type === 6 || msg.type === 19));
               skippedMsgs += bulk.filter((msg) => !out.find((m) => m.id === msg.id)).length;
            }

            return {
               messages: out.sort((a, b) => b.id - a.id),
               offset: skippedMsgs + offset,
               skipped: skippedMsgs
            };
         };

         chunk(arr, size) {
            const array = [];

            for (var i = 0; i < arr.length; i += size) {
               array.push(arr.slice(i, i + size));
            }

            return array;
         }
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/
