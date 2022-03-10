/**
 * @name UploadFromLinks
 * @source https://github.com/discord-modifications/better-discord-plugins/blob/master/UploadFromLinks/UploadFromLinks.plugin.js
 * @updateUrl https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/UploadFromLinks/UploadFromLinks.plugin.js
 * @website https://github.com/discord-modifications/better-discord-plugins/tree/master/UploadFromLinks/UploadFromLinks.plugin.js
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
         name: 'UploadFromLinks',
         authors: [
            {
               name: 'eternal',
               discord_id: '282595588950982656',
               github_username: 'eternal404'
            }
         ],
         version: '2.0.3',
         description: 'Allows you to upload from links by surrounding the link in brackets.',
         github: 'https://github.com/eternal404',
         github_raw: 'https://raw.githubusercontent.com/discord-modifications/better-discord-plugins/master/UploadFromLinks/UploadFromLinks.plugin.js'
      },
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
      const { WebpackModules, Patcher } = API;
      const { get } = require('request');

      const messages = WebpackModules.getByProps('sendMessage', 'editMessage', 'deleteMessage');
      const { upload } = WebpackModules.getByProps('cancel', 'upload');

      return class extends Plugin {
         constructor() {
            super();
         }

         start() {
            Patcher.before(messages, 'sendMessage', (_, args) => {
               if (this.processMessage(args[0], args[1])) return false;
               return args;
            });
         };

         stop() {
            Patcher.unpatchAll();
         };

         processMessage(cid, msg) {
            if (!msg.content) return;
            const files = [];
            const search = msg.content.split('[').join('][').split(']');

            for (let i = 0; i < search.length; i++) {
               const arr = search[i].replace('[', '').split(',');
               let name = arr[1] || arr[0].split('/').pop().split('?')[0];

               if (search[i].startsWith('[http')) {
                  files.push({ url: arr[0], name });
                  msg.content = msg.content.replace(search[i] + ']', '');
               } else if ((process.platform == 'win32' && search[i].match(/^[A-Z]:(\/|\\)/)) ||
                  (process.platform != 'win32' && search[i].startsWith('[/'))) {
                  if (name.includes('\\')) name = name.split('\\').pop();
                  files.push({ path: arr[0], name });
                  msg.content = msg.content.replace(search[i] + ']', '');
               }
            }

            if (files.length) this.uploadFiles(cid, msg, files);

            return files.length;
         }


         async uploadFiles(cid, msg, files) {
            for (let i = 0; i < files.length; i++) {
               let file;

               if (files[i].url) {
                  file = new File([await this.getFile(encodeURI(files[i].url))], files[i].name);
               } else {
                  file = new File([readFileSync(files[i].path)], files[i].name);
               };

               upload(cid, file, msg);
               msg.content = '';
            }
         }

         async getFile(url) {
            return new Promise(async (resolve, reject) => {
               get(url, { encoding: null }, (err, res, body) => {
                  if (err) reject(err);
                  resolve(body);
               });
            });
         }
      };
   })(ZLibrary.buildPlugin(config));
})();

/*@end@*/
