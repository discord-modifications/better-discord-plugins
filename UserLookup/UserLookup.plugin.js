/**
 * @name UserLookup
 * @source https://github.com/slow/better-discord-plugins/blob/master/UserLookup/UserLookup.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/UserLookup/UserLookup.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/UserLookup/UserLookup.plugin.js
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

const { getUser } = BdApi.findModuleByProps('getUser');

module.exports = (() => {
   const config = {
      main: 'index.js',
      info: {
         name: 'UserLookup',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'slow',
               twitter_username: ''
            }
         ],
         version: '3.0.3',
         description: 'Adds a command to look up information about the user using their ID.',
         github: 'https://github.com/slow',
         github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/UserLookup.plugin.js'
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
      return class UserLookup extends Plugin {
         constructor() {
            super();
         }

         start() {
            commands.register({
               command: 'whois',
               aliases: ['id', 'lookup'],
               label: 'User ID Info',
               usage: '{c} <id>',
               description: 'Lookup user info from a user id',
               executor: this.getInfo
            });
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
               let difference = UserLookup.differentiate(Date.now(), unix);

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

         static differentiate(current, previous) {
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
            commands.unregister('whois');
         };
      };
   };

   return !global.ZeresPluginLibrary || !global.commands ? class {
      constructor() {
         this._XL_PLUGIN = true;
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
         if (global.eternalModal) {
            while (global.eternalModal) {
               await new Promise(f => setTimeout(f, 1000));
            }

            if (global.commands) return BdApi.Plugins.reload(this.getName());
         };

         global.eternalModal = true;
         let missing = {
            ZeresPluginLibrary: false,
            CommandsAPI: false
         };
         if (!global.ZeresPluginLibrary) missing.ZeresPluginLibrary = true;
         if (!global.commands) missing.CommandsAPI = true;
         let missingCount = 0;
         Object.values(missing).map(m => m ? missingCount++ : '');

         BdApi.showConfirmationModal(missingCount == 1 ? 'Library plugin needed' : 'Library plugins needed',
            `The library plugin${missingCount > 1 ? 's' : ''} needed for ${config.info.name} is missing. Please click Download to install the dependecies.`, {
            confirmText: 'Download',
            cancelText: 'Cancel',
            onCancel: () => {
               delete global.eternalModal;
            },
            onConfirm: async () => {
               if (missing.ZeresPluginLibrary) {
                  await new Promise((fulfill, reject) => {
                     require('request').get('https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js', async (error, response, body) => {
                        if (error) {
                           return electron.shell.openExternal('https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js');
                        }
                        require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '0PluginLibrary.plugin.js'), body, fulfill);
                     });
                  });
               }
               if (missing.CommandsAPI) {
                  await new Promise((fulfill, reject) => {
                     require('request').get('https://raw.githubusercontent.com/slow/better-discord-plugins/master/CommandsAPI/CommandsAPI.plugin.js', async (error, response, body) => {
                        if (error) {
                           return electron.shell.openExternal('https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/slow/better-discord-plugins/master/CommandsAPI/CommandsAPI.plugin.js');
                        }
                        require('fs').writeFile(require('path').join(BdApi.Plugins.folder, '2CommandsAPI.plugin.js'), body, fulfill);
                     });
                  });
               }

               while (!window.commands?.register) {
                  await new Promise(f => setTimeout(f, 1000));
                  BdApi.Plugins.reload(this.getName());
               }


               delete global.eternalModal;
            }
         });
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