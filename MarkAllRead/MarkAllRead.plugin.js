/**
 * @name MarkAllRead
 * @source https://github.com/slow/better-discord-plugins/blob/master/MarkAllRead/MarkAllRead.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/MarkAllRead/MarkAllRead.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/MarkAllRead/MarkAllRead.plugin.js
 * @authorId 282595588950982656
 * @invite shnvz5ryAt
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
         name: 'MarkAllRead',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'slow',
               twitter_username: ''
            }
         ],
         version: '3.0.3',
         description: 'Adds the command "read" that reads channels, DMs and removes pings.',
         github: 'https://github.com/slow',
         github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/MarkAllRead/MarkAllRead.plugin.js'
      },
      changelog: [
         {
            title: 'Fixed',
            type: 'fixed',
            items: [
               'CommandsAPI boot priority.',
               'Multiple modals popping up when libraries are missing'
            ]
         }
      ],
   };

   const buildPlugin = ([Plugin, API]) => {
      return class MarkAllRead extends Plugin {
         constructor() {
            super();
         }

         async start() {
            const { findModuleByProps } = BdApi;
            const { getMutableGuildAndPrivateChannels } = findModuleByProps('getChannel');
            const unreadAcks = findModuleByProps('ack', 'ackCategory');
            const messageStore = findModuleByProps('hasUnread', 'lastMessageId');

            if (!window.commands) window.commands = {};
            if (!window.commands?.['read']) {
               window.commands['read'] = {
                  command: 'read',
                  description: 'Read all channels & remove pings',
                  usage: '{c}',
                  executor: async () => {
                     let channels = Object.keys(getMutableGuildAndPrivateChannels());
                     const unreads = channels.map(c => ({
                        channelId: c,
                        messageId: messageStore.lastMessageId(c)
                     }));
                     return await unreadAcks.bulkAck(unreads);
                  }
               };
            }
         };

         stop() {
            delete window.commands?.['read'];
         };
      };
   };

   return !global.ZeresPluginLibrary || !global.CommandsAPI ? class {
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
            }
         ];

         if (global.eternalModal) {
            while (global.eternalModal) {
               await new Promise(f => setTimeout(f, 1000));
            }

            if (!dependencies.map(d => window.hasOwnProperty(d.global)).includes(false)) return;
         };

         global.eternalModal = true;

         if (dependencies.map(d => !window.hasOwnProperty(d.global)).includes(true)) {
            BdApi.showConfirmationModal(
               'Dependencies needed',
               `Dependencies needed for ${this.getName()} is missing. Please click download to install the dependecies.`,
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
         };
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