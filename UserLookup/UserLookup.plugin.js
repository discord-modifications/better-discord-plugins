/**
 * @name UserLookup
 * @source https://github.com/slow/better-discord-plugins/blob/master/UserLookup/UserLookup.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/UserLookup/UserLookup.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/UserLookup/UserLookup.plugin.js
 * @authorId 282595588950982656
 * @invite shnvz5ryAt
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
         name: 'UserLookup',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'slow'
            }
         ],
         version: '3.0.9',
         description: 'Adds a command to look up information about the user using their ID.',
         github: 'https://github.com/slow',
         github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/UserLookup/UserLookup.plugin.js'
      }
   };

   return !global.ZeresPluginLibrary || !global.CommandsAPI ? class {
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
               global: 'CommandsAPI',
               filename: '2CommandsAPI.plugin.js',
               external: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/CommandsAPI/2CommandsAPI.plugin.js',
               url: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/CommandsAPI/2CommandsAPI.plugin.js'
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
      const { WebpackModules } = API;
      const { getUser } = WebpackModules.getByProps('getUser');

      return class extends Plugin {
         constructor() {
            super();
         }

         start() {
            if (!window.commands) window.commands = {};
            if (!window.commands['whois']) {
               window.commands['whois'] = {
                  command: 'whois',
                  aliases: ['id', 'lookup'],
                  label: 'User ID Info',
                  usage: '{c} <id>',
                  description: 'Lookup user info from a user id',
                  executor: this.getInfo.bind(this)
               };
            }
         };

         async getInfo(id) {
            try {
               let user = await getUser(String(id));
               let tag = `${user.username}#${user.discriminator}`;
               let avatar;

               if (!user.avatar) {
                  avatar = `https://canary.discord.com${user.avatarURL}`;
               } else {
                  avatar = `https://cdn.discordapp.com/avatars/${String(user.id)}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=4096`;
               }

               let unix = (id / 4194304) + 1420070400000;
               let time = new Date(unix);
               let date = `${time.getMonth() + 1}/${time.getDate()}/${time.getFullYear()} `;
               let difference = this.differentiate(Date.now(), unix);

               return {
                  result: {
                     type: 'rich',
                     title: `User Lookup for ${tag}`,
                     color: 0xff0000,
                     fields: [
                        { name: 'ID', value: String(id) },
                        { name: 'Tag', value: `<@${id}> ` },
                        { name: 'Username', value: tag },
                        { name: 'Bot', value: user.bot ? 'Yes' : 'No' },
                        { name: 'Avatar', value: `[URL](${avatar})` },
                        { name: 'Created', value: `${date} (${difference})` }
                     ]
                  },
                  embed: true
               };
            } catch (err) {
               console.log(err);
               return {
                  result: 'Invalid ID.'
               };
            }
         }

         differentiate(current, previous) {
            var msPerMinute = 60 * 1000;
            var msPerHour = msPerMinute * 60;
            var msPerDay = msPerHour * 24;
            var msPerMonth = msPerDay * 30;
            var msPerYear = msPerDay * 365;
            var elapsed = current - previous;
            if (elapsed < msPerMinute) {
               return `${Math.round(elapsed / 1000)} seconds ago`;
            } else if (elapsed < msPerHour) {
               return `${Math.round(elapsed / msPerMinute)} minutes ago`;
            } else if (elapsed < msPerDay) {
               return `${Math.round(elapsed / msPerHour)} hours ago`;
            } else if (elapsed < msPerMonth) {
               return `${Math.round(elapsed / msPerDay)} days ago`;
            } else if (elapsed < msPerYear) {
               return `${Math.round(elapsed / msPerMonth)} months ago`;
            } else {
               return `${Math.round(elapsed / msPerYear)} years ago`;
            }
         }

         stop() {
            delete window.commands?.['whois'];
         };
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/
