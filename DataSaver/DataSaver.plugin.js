/**
 * @name DataSaver
 * @source https://github.com/slow/better-discord-plugins/blob/master/DataSaver/DataSaver.plugin.js
 * @updateUrl https://raw.githubusercontent.com/slow/better-discord-plugins/master/DataSaver/DataSaver.plugin.js
 * @website https://github.com/slow/better-discord-plugins/tree/master/DataSaver/DataSaver.plugin.js
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
         name: 'DataSaver',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'slow'
            }
         ],
         version: '1.0.4',
         description: 'Saves friends & Servers every 30 minutes to a file.',
         github: 'https://github.com/slow',
         github_raw: 'https://raw.githubusercontent.com/slow/better-discord-plugins/master/DataSaver/DataSaver.plugin.js'
      },
   };

   return !global.ZeresPluginLibrary ? class {
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
      const fs = require('fs');

      const { getRelationships } = WebpackModules.getByProps('getRelationships');
      const { getUser } = WebpackModules.getByProps('getUser');
      const { getGuilds } = WebpackModules.getByProps('getGuilds');

      return class extends Plugin {
         constructor() {
            super();
         }

         start() {
            this.interval = setInterval(async () => {
               let path = {
                  friends: '%userprofile%\\Documents\\Discord\\',
                  servers: '%userprofile%\\Documents\\Discord\\'
               };

               let fileNames = {
                  friends: 'Discord Friends',
                  servers: 'Discord Servers'
               };

               let obj = {
                  servers: [],
                  friends: []
               };

               for (let friend of Object.keys(getRelationships())) {
                  friend = await getUser(friend);

                  if (!friend || !friend.id) continue;

                  obj.friends.push({
                     username: friend.username,
                     discriminator: friend.discriminator,
                     id: friend.id,
                     tag: `${friend.username}#${friend.discriminator}`
                  });
               };

               for (let { id, name, vanityURLCode, ownerId } of Object.values(getGuilds())) {
                  obj.servers.push({ id, name, vanityURLCode, ownerId });
               }

               for (let save of Object.keys(obj)) {
                  let savePath = path[save].replace(/%([^%]+)%/g, (_, n) => process.env[n]);
                  if (!fs.existsSync(savePath)) {
                     fs.mkdirSync(savePath, { recursive: true });
                  }
                  fs.writeFile(`${savePath}${fileNames[save]}.json`.replace(/%([^%]+)%/g, (_, n) => process.env[n]), JSON.stringify(obj[save]), (err) => {
                     if (err) console.log(err);
                  });
               }
            }, 18e5);
         };

         stop() {
            clearInterval(this.interval);
         };
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/
