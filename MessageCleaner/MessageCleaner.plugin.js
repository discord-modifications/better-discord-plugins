/**
 * @name MessageCleaner
 * @source https://github.com/slow/better-discord-plugins/blob/master/MessageCleaner/MessageCleaner.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/MessageCleaner/MessageCleaner.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/MessageCleaner/MessageCleaner.plugin.js
 * @invite shnvz5ryAt
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
      main: 'index.js',
      info: {
         name: 'MessageCleaner',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'slow',
               twitter_username: ''
            }
         ],
         description: 'Clears messages in the current channel.',
         version: '1.0.9',
         github: 'https://github.com/slow',
         github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/MessageCleaner/MessageCleaner.plugin.js'
      },
      changelog: [],
      defaultConfig: [
         {
            name: 'Deletion Mode',
            id: 'mode',
            type: 'radio',
            options: [
               { name: 'Normal: Deletes one message at a time (most stable but slower)', value: 0 },
               { name: 'Burst: Deletes in burst for every x messages (unstable but fast)', value: 1 }
            ],
            defaultValue: 0
         },
         {
            name: 'Normal Delay',
            id: 'normalDelay',
            type: 'slider',
            min: 100,
            max: 200,
            value: 200,
            note: 'Delay between deleting messages on normal mode in milliseconds',
            markers: [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200],
            renderValue: v => `${Math.round(v)}ms`
         },
         {
            name: 'Burst Delay',
            id: 'burstDelay',
            type: 'slider',
            min: 500,
            max: 1500,
            value: 200,
            note: 'Delay between burst deleting messages on burst mode in milliseconds',
            markers: [500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500],
            renderValue: v => `${Math.round(v)}ms`
         },
         {
            name: 'Burst Chunk Size',
            id: 'chunkSize',
            type: 'slider',
            stickToMarkers: true,
            min: 1,
            max: 10,
            markers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            note: 'Collection size of burst deletion chunks to delete every x milliseconds',
            value: 3
         }
      ]
   };

   const buildPlugin = ([Plugin, API]) => {
      const { WebpackModules, Patcher, Logger, PluginUtilities } = API;
      const { getToken } = WebpackModules.getByProps('getToken');
      const { getChannelId } = WebpackModules.getByProps('getLastSelectedChannelId');
      const ChannelStore = WebpackModules.getByProps('openPrivateChannel');
      const { getChannel } = WebpackModules.getByProps('getChannel');
      const { getUser } = WebpackModules.getByProps('getUser');
      const { getGuild } = WebpackModules.getByProps('getGuild');
      const { getCurrentUser } = WebpackModules.getByProps('getCurrentUser');
      const messages = WebpackModules.getByProps('sendMessage', 'editMessage');
      const sleep = (time) => new Promise((f) => setTimeout(() => f(), time));

      return class MessageCleaner extends Plugin {
         constructor() {
            super();

            this.pruning = {};
         }

         async start() {
            const settings = this.settings = PluginUtilities.loadSettings(this.name, {
               mode: 0,
               normalDelay: 150,
               burstDelay: 1000,
               chunkSize: 3
            });

            if (!Array.prototype.chunk) {
               Object.defineProperty(Array.prototype, 'chunk', {
                  value: function (size) {
                     var array = [];
                     for (var i = 0; i < this.length; i += size) {
                        array.push(this.slice(i, i + size));
                     }
                     return array;
                  }
               });
            }

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
         };

         stop() {
            delete window.commands?.['clear'];
         };

         getSettingsPanel() {
            return this.buildSettingsPanel().getElement();
         }

         async clear(args) {
            const { BOT_AVATARS } = WebpackModules.getByProps('BOT_AVATARS');
            const { createBotMessage } = WebpackModules.getByProps('createBotMessage');

            this.channel = getChannelId();

            const receivedMessage = createBotMessage(this.channel, {});
            BOT_AVATARS.message_cleaner = 'https://i.imgur.com/dOe7F3y.png';
            receivedMessage.author.username = 'Message Cleaner';
            receivedMessage.author.avatar = 'message_cleaner';

            if (args.length === 0) {
               receivedMessage.content = 'Please specify an amount.';
               return messages.receiveMessage(receivedMessage.channel_id, receivedMessage);
            }

            if (this.pruning[this.channel] == true) {
               receivedMessage.content = `Already pruning in this channel.`;
               return messages.receiveMessage(receivedMessage.channel_id, receivedMessage);
            }

            let count = args.shift();
            let before = args.shift();

            this.pruning[this.channel] = true;

            if (count !== 'all') {
               count = parseInt(count);
            }

            if (count <= 0 || count == NaN) {
               receivedMessage.content = 'Amount must be specified.';
               return messages.receiveMessage(receivedMessage.channel_id, receivedMessage);
            }

            receivedMessage.content = `Started clearing.`;
            messages.receiveMessage(receivedMessage.channel_id, receivedMessage);

            let amount = this.settings.mode ? await this.burstDelete(count, before, this.channel) : await this.normalDelete(count, before, this.channel);

            delete this.pruning[this.channel];

            if (amount !== 0) {
               let location = this.channel;
               let instance = await getChannel(location);
               if (instance.type == 0) {
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


         async normalDelete(count, before, channel) {
            let deleted = 0;
            let offset = 0;
            while (count == 'all' || count > deleted) {
               if (count !== 'all' && count === deleted) break;
               let get = await this.fetch(channel, getCurrentUser().id, before, offset);
               if (get.messages.length <= 0 && get.skipped == 0) break;
               offset = get.offset;
               while (count !== 'all' && count < get.messages.length) get.messages.pop();
               for (const msg of get.messages) {
                  await sleep(this.settings.normalDelay);
                  deleted += await this.deleteMsg(msg.id, channel);
               }
            }
            return deleted;
         }

         async burstDelete(count, before, channel) {
            let deleted = 0;
            let offset = 0;
            while (count == 'all' || count > deleted) {
               if (count !== 'all' && count === deleted) break;
               let get = await this.fetch(channel, getCurrentUser().id, before, offset);
               if (get.messages.length <= 0 && get.skipped == 0) break;
               offset = get.offset;
               while (count !== 'all' && count < get.messages.length) get.messages.pop();
               let chunk = get.messages.chunk(this.settings.chunkSize);
               for (const msgs of chunk) {
                  let funcs = [];
                  for (const msg of msgs) {
                     funcs.push(async () => {
                        return await this.deleteMsg(msg.id, channel);
                     });
                  }
                  await Promise.all(
                     funcs.map((f) => {
                        return f().then((amount) => {
                           deleted += amount;
                        });
                     })
                  );
                  await sleep(this.settings.burstDelay);
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

         async fetch(channel, user, before, offset) {
            let out = [];
            let get = await fetch(
               `https://discord.com/api/v6/channels/${channel}/messages/search?author_id=${user}${before ? `&max_id=${before}` : ''}${offset > 0 ? `&offset=${offset}` : ''}`,
               {
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
               out.push(...bulk.filter((msg) => msg.type === 0 || msg.type === 6));
               skippedMsgs += bulk.filter((msg) => !out.find((m) => m.id === msg.id)).length;
            }

            return {
               messages: out.sort((a, b) => b.id - a.id),
               offset: skippedMsgs + offset,
               skipped: skippedMsgs
            };
         };

         async random(length) {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for (var i = 0; i < length; i++) {
               result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
         }
      };
   };

   return !global.ZeresPluginLibrary || !global.XenoLib || !global.CommandsAPI ? class {
      constructor() {
         this.start = this.load = this.handleMissingLib;
      }

      getName() {
         return this.name.replace(/\s+/g, '');
      }

      getAuthor() {
         return this.author;
      }

      getVersion() {
         return this.version;
      }

      getDescription() {
         return this.description + ' You are missing libraries for this plugin, please enable the plugin and click Download Now.';
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
               global: 'CommandsAPI',
               filename: '2CommandsAPI.plugin.js',
               external: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/CommandsAPI/CommandsAPI.plugin.js',
               url: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/CommandsAPI/CommandsAPI.plugin.js'
            },
            {
               global: 'XenoLib',
               filename: '1XenoLib.plugin.js',
               external: 'https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/1XenoLib.plugin.js',
               url: 'https://raw.githubusercontent.com/1Lighty/BetterDiscordPlugins/master/Plugins/1XenoLib.plugin.js'
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

                  while (dependencies.map(d => window.hasOwnProperty(d.global)).includes(false)) await new Promise(f => setTimeout(f, 10));
                  BdApi.Plugins.reload(this.getName());
               }
            }
         );
      }

      get [Symbol.toStringTag]() {
         return 'Plugin';
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
   } : buildPlugin(global.ZeresPluginLibrary.buildPlugin(config));
})();
